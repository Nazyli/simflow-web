import { useQuery } from '@tanstack/react-query'
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useNodesInitialized,
  useReactFlow,
  useViewport,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react'
import { CircleAlert, MapPin, Maximize } from 'lucide-react'
import dagre from 'dagre'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type EdgePathType } from '../../components/button-edge'
import { Slider } from '../../components/ui/slider'
import { NodeSearch } from '../../components/ui/node-search'
import { getNodeExecutions } from '../../shared/api/executions'
import { getNodeCatalog } from '../../shared/api/node-catalog'
import { getGraph, type ApiEdge, type ApiNode } from '../../shared/api/simulations'
import { EmptyState, LoadingState } from '../../shared/components/async-state'
import type { NodeDefinition, VisualGroup } from '../../shared/types/simulation'
import { SimulationGraphNode } from '../simulation_studio/simulation-graph-node'
import { SimulationGraphEdge } from '../simulation_studio/simulation-graph-edge'
import { SimulationVisualGroupNode } from '../simulation_studio/visual-groups/simulation-visual-group-node'
import {
  projectWorkflowEdges,
  projectWorkflowNodes,
} from '../simulation_studio/visual-groups/visual-group-projection'
import { deriveNodeSummary } from '../../shared/utils/node-summary'
import { selectParticipantFocusNodeId } from './participant-flow-focus'

const nodeRenderers = {
  simulation: SimulationGraphNode,
  visualGroup: SimulationVisualGroupNode,
}
const edgeRenderers = { simulation: SimulationGraphEdge }
const MASTER_COLOR = '#94a3b8'
const PATH_COLOR = '#7c3aed'

type EdgePathReport = { path: string; sx: number; sy: number; tx: number; ty: number }

const STUDIO_MIN_ZOOM = 0.1
const STUDIO_MAX_ZOOM = 4
const STUDIO_ZOOM_SLIDER_MIN = 10
const STUDIO_ZOOM_SLIDER_MAX = 400

/** Measures a path in pane coordinates; returns its length in px. */
function measurePathLength(d: string): number {
  try {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    el.setAttribute('d', d)
    return el.getTotalLength() || 0
  } catch {
    return 0
  }
}

/**
 * Single traveling dot rendered as a stable overlay SVG that is synced to the
 * React Flow viewport. Unlike rendering inside an edge, this element is never
 * remounted by edge reconciliation, so the SMIL animation runs continuously.
 */
function PathTravelingDot({ path, color }: { path: string | null; color: string }) {
  const { x, y, zoom } = useViewport()
  const duration = useMemo(() => {
    if (!path) return 4
    return Math.max(1.2, Math.round((measurePathLength(path) / 120) * 10) / 10)
  }, [path])
  if (!path) return null
  return (
    <svg
      className="history-path-traveling-dot pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
      style={{ transform: `translate(${x}px, ${y}px) scale(${zoom})`, transformOrigin: '0 0' }}
      aria-hidden
    >
      <circle
        r="7"
        fill={color}
        fillOpacity={1}
        stroke="#fff"
        strokeWidth={1.5}
        style={{ filter: 'drop-shadow(0 0 5px rgba(124,58,237,0.8))' }}
      >
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" path={path} />
      </circle>
    </svg>
  )
}

function ZoomSliderPanel() {
  const { zoom } = useViewport()
  const { zoomTo } = useReactFlow()
  const percent = Math.round(zoom * 100)
  const clamped = Math.min(STUDIO_ZOOM_SLIDER_MAX, Math.max(STUDIO_ZOOM_SLIDER_MIN, percent))
  return (
    <div
      className="absolute bottom-[12px] left-[72px] z-10 flex h-9 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-700 shadow-md sm:px-3"
      aria-label="Zoom slider"
    >
      <span className="hidden text-[10px] font-bold tracking-widest text-slate-500 lg:inline">
        ZOOM
      </span>
      <Slider
        value={[clamped]}
        min={STUDIO_ZOOM_SLIDER_MIN}
        max={STUDIO_ZOOM_SLIDER_MAX}
        step={1}
        onValueChange={(vals) => {
          const next = (vals[0] ?? 100) / 100
          const clampedNext = Math.min(STUDIO_MAX_ZOOM, Math.max(STUDIO_MIN_ZOOM, next))
          zoomTo(clampedNext)
        }}
        className="w-20 sm:w-28 lg:w-36"
        aria-label="Zoom level"
      />
      <span className="w-9 shrink-0 text-right text-xs font-medium text-slate-700 tabular-nums sm:w-10">
        {clamped}%
      </span>
    </div>
  )
}

function ParticipantFocusViewport({
  focusNodeId,
  nodeCount,
}: {
  focusNodeId: string | null
  nodeCount: number
}) {
  const { fitView, getInternalNode, setCenter } = useReactFlow()
  const nodesInitialized = useNodesInitialized({ includeHiddenNodes: true })
  const focusedNodeId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (!nodesInitialized || nodeCount === 0 || focusedNodeId.current === focusNodeId) return

    if (!focusNodeId) {
      focusedNodeId.current = focusNodeId
      const frame = requestAnimationFrame(() => fitView({ padding: 0.2, duration: 240 }))
      return () => cancelAnimationFrame(frame)
    }

    const flowNode = getInternalNode(focusNodeId)
    if (!flowNode) return

    const position = flowNode.internals.positionAbsolute ?? flowNode.position
    const width = flowNode.measured?.width ?? 200
    const height = flowNode.measured?.height ?? 90
    focusedNodeId.current = focusNodeId
    const frame = requestAnimationFrame(() =>
      setCenter(position.x + width / 2, position.y + height / 2, {
        zoom: 1,
        duration: 240,
      }),
    )
    return () => cancelAnimationFrame(frame)
  }, [fitView, focusNodeId, getInternalNode, nodeCount, nodesInitialized, setCenter])

  return null
}

function dagLayout(
  apiNodes: ApiNode[],
  apiEdges: ApiEdge[],
): Map<string, { x: number; y: number }> {
  const nodeIds = new Set(apiNodes.map((n) => n.nodeId))
  const graph = new dagre.graphlib.Graph()
  graph.setGraph({
    rankdir: 'LR',
    nodesep: 130,
    ranksep: 200,
    marginx: 60,
    marginy: 60,
  })
  graph.setDefaultEdgeLabel(() => ({}))
  apiNodes.forEach((node) => graph.setNode(node.nodeId, { width: 200, height: 90 }))
  apiEdges.forEach((edge) => {
    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) return
    graph.setEdge(edge.sourceNodeId, edge.targetNodeId)
  })
  dagre.layout(graph)
  const positions = new Map<string, { x: number; y: number }>()
  apiNodes.forEach((node) => {
    const meta = graph.node(node.nodeId)
    if (!meta) return
    positions.set(node.nodeId, {
      x: meta.x - meta.width / 2,
      y: meta.y - meta.height / 2,
    })
  })
  return positions
}

export function ParticipantFlowCanvas({
  simulationId,
  executionId,
  currentState,
  executionStatus,
}: {
  simulationId: string
  executionId: string
  currentState: string | null
  executionStatus?: string | null
}) {
  const graph = useQuery({
    queryKey: ['graph', simulationId],
    queryFn: () => getGraph(simulationId),
    enabled: Boolean(simulationId),
  })
  const nodeCatalog = useQuery({
    queryKey: ['node-catalog'],
    queryFn: getNodeCatalog,
  })
  const nodeExecutions = useQuery({
    queryKey: ['node-executions', executionId],
    queryFn: () => getNodeExecutions(executionId),
    enabled: Boolean(executionId),
  })

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [edgePathType, setEdgePathType] = useState<EdgePathType>('smoothstep')
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [localGroups, setLocalGroups] = useState<VisualGroup[]>([])
  const [pathReports, setPathReports] = useState<Record<string, EdgePathReport>>({})

  const handleEdgePathReady = useCallback((edgeId: string, report: EdgePathReport) => {
    setPathReports((prev) => {
      const existing = prev[edgeId]
      if (
        existing &&
        existing.path === report.path &&
        existing.sx === report.sx &&
        existing.sy === report.sy &&
        existing.tx === report.tx &&
        existing.ty === report.ty
      ) {
        return prev
      }
      return { ...prev, [edgeId]: report }
    })
  }, [])

  const apiVisualGroups = graph.data?.visualGroups ?? []

  useEffect(() => {
    setLocalGroups(apiVisualGroups)
  }, [apiVisualGroups])

  const effectiveGroups =
    localGroups.length > 0 || apiVisualGroups.length === 0 ? localGroups : apiVisualGroups
  const groupsForRender = useMemo(() => {
    if (localGroups.length === 0 && apiVisualGroups.length > 0) return apiVisualGroups
    return effectiveGroups
  }, [localGroups, apiVisualGroups, effectiveGroups])

  const handleToggleGroup = (groupId: string) => {
    setLocalGroups((prev) => {
      const base = prev.length > 0 ? prev : apiVisualGroups
      return base.map((g) =>
        g.visualGroupId === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g,
      )
    })
  }

  const isExecutionActive =
    !executionStatus || !['completed', 'failed', 'cancelled'].includes(executionStatus ?? '')

  const view = useMemo(() => {
    const apiNodes: ApiNode[] = graph.data?.nodes ?? []
    const apiEdges: ApiEdge[] = graph.data?.edges ?? []
    const definitions = new Map(
      (nodeCatalog.data?.nodes ?? []).map((definition: NodeDefinition) => [
        definition.nodeType,
        definition,
      ]),
    )
    const nodeById = new Map(apiNodes.map((node) => [node.nodeId, node]))
    const layout = dagLayout(apiNodes, apiEdges)

    const referencedIds = new Set<string>()
    for (const item of nodeExecutions.data ?? []) referencedIds.add(item.nodeId)

    const visitedNodeIds = new Set<string>()
    const externalNodeIds = new Set<string>()
    for (const id of referencedIds) {
      if (nodeById.has(id)) visitedNodeIds.add(id)
      else externalNodeIds.add(id)
    }

    const takenEdgeIds = new Set<string>()
    for (const item of nodeExecutions.data ?? []) {
      if (item.selectedEdgeId) takenEdgeIds.add(item.selectedEdgeId)
    }

    const focusNodeId = selectParticipantFocusNodeId(
      currentState,
      nodeExecutions.data ?? [],
      new Set(nodeById.keys()),
    )
    const effectiveCurrentId = focusNodeId

    const baseWorkflowNodes: Node[] = apiNodes.map((node) => {
      const definition = definitions.get(node.nodeType)
      const visited = visitedNodeIds.has(node.nodeId)
      const isCurrent = node.nodeId === effectiveCurrentId
      // Always show orbiting border on participant's last node (currentState if present, else last visited)
      const isActiveCurrent = Boolean(isCurrent)
      return {
        id: node.nodeId,
        type: 'simulation',
        position:
          node.positionX !== null && node.positionY !== null
            ? { x: node.positionX, y: node.positionY }
            : (layout.get(node.nodeId) ?? { x: 80, y: 80 }),
        className: visited
          ? `history-node-visited${isCurrent ? ' history-node-current' : ''}${isActiveCurrent ? ' history-node-current--active' : ''}`
          : 'history-node-unvisited',
        data: {
          label: node.nodeName,
          nodeType: node.nodeType,
          color: definition?.color ?? '#64748b',
          inputPorts: node.inputPorts,
          outputPorts: node.outputPorts,
          rotation: node.rotation ?? 0,
          summary: deriveNodeSummary(node.parameters as Record<string, unknown>),
          category: node.category ?? definition?.category ?? null,
          editable: false,
          status: isActiveCurrent ? 'active' : null,
        },
      }
    })

    const groupNodes: Node[] = groupsForRender.map((group) => ({
      id: group.visualGroupId,
      type: 'visualGroup',
      position: { x: group.positionX, y: group.positionY },
      style: { width: group.width, height: group.isCollapsed ? 32 : group.height },
      draggable: true,
      selectable: true,
      zIndex: 0,
      dragHandle: '.visual-group-header',
      data: {
        group,
        editable: false,
        onToggleCollapsed: handleToggleGroup,
      },
    }))

    const projectedWorkflowNodes: Node[] =
      groupsForRender.length > 0
        ? projectWorkflowNodes(baseWorkflowNodes, groupsForRender)
        : baseWorkflowNodes

    const flowNodes: Node[] = [...groupNodes, ...projectedWorkflowNodes]

    const groupById = new Map(groupsForRender.map((g) => [g.visualGroupId, g]))
    const projectedEdges = projectWorkflowEdges(apiEdges, groupsForRender)

    const flowEdges: Edge[] = projectedEdges.map((edge) => {
      const taken = takenEdgeIds.has(edge.edgeId)
      const sourcePort = nodeById
        .get(edge.sourceNodeId)
        ?.outputPorts.find((port) => port.id === edge.sourcePortId)
      const sourceGroup = edge.sourceGroupId ? groupById.get(edge.sourceGroupId) : undefined
      const targetGroup = edge.targetGroupId ? groupById.get(edge.targetGroupId) : undefined
      const styleColor = taken ? PATH_COLOR : (sourcePort?.edgeStyle.color ?? MASTER_COLOR)
      const lineStyle = taken ? 'solid' : (sourcePort?.edgeStyle.lineStyle ?? 'dashed')
      const emphasis = taken ? 'participant' : 'background'
      return {
        id: edge.edgeId,
        type: 'simulation',
        hidden: edge.hidden,
        source: edge.visualSourceNodeId ?? edge.sourceNodeId,
        sourceHandle: edge.visualSourceHandleId ?? edge.sourcePortId,
        target: edge.visualTargetNodeId ?? edge.targetNodeId,
        targetHandle: edge.visualTargetHandleId ?? edge.targetPortId,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: taken ? PATH_COLOR : '#cbd5e1',
        },
        animated: taken,
        data: {
          label: sourcePort?.label ?? edge.sourcePortId,
          style: {
            color: taken ? PATH_COLOR : styleColor,
            lineStyle,
            animated: taken,
          },
          emphasis,
          edgeType: edgePathType,
          onPathReady: handleEdgePathReady,
          collapsedSourceRect: sourceGroup
            ? {
                x: sourceGroup.positionX,
                y: sourceGroup.positionY,
                width: sourceGroup.width,
                height: sourceGroup.isCollapsed ? 32 : sourceGroup.height,
              }
            : undefined,
          collapsedTargetRect: targetGroup
            ? {
                x: targetGroup.positionX,
                y: targetGroup.positionY,
                width: targetGroup.width,
                height: targetGroup.isCollapsed ? 32 : targetGroup.height,
              }
            : undefined,
        },
      }
    })

    return {
      flowNodes,
      flowEdges,
      visitedCount: visitedNodeIds.size,
      takenCount: takenEdgeIds.size,
      focusNodeId,
      externalStates: { nodeIds: [...externalNodeIds] },
    }
  }, [
    currentState,
    edgePathType,
    graph.data,
    nodeCatalog.data,
    nodeExecutions.data,
    groupsForRender,
    isExecutionActive,
  ])

  // Participant path order: node executions sorted by sequence number → the
  // selected edges they traversed, deduped and restricted to edges that are
  // actually part of the current graph (only those can report a path).
  const orderedTakenEdgeIds = useMemo(() => {
    const edgeIdsInGraph = new Set((graph.data?.edges ?? []).map((edge) => edge.edgeId))
    const ordered: string[] = []
    const seen = new Set<string>()
    const sorted = [...(nodeExecutions.data ?? [])].sort(
      (a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0),
    )
    for (const item of sorted) {
      const edgeId = item.selectedEdgeId
      if (edgeId && edgeIdsInGraph.has(edgeId) && !seen.has(edgeId)) {
        seen.add(edgeId)
        ordered.push(edgeId)
      }
    }
    return ordered
  }, [graph.data?.edges, nodeExecutions.data])

  const hiddenEdgeIds = useMemo(
    () => new Set(view.flowEdges.filter((edge) => edge.hidden).map((edge) => edge.id)),
    [view.flowEdges],
  )

  const combinedPath = useMemo(() => {
    let path = ''
    for (const edgeId of orderedTakenEdgeIds) {
      if (hiddenEdgeIds.has(edgeId)) continue
      const report = pathReports[edgeId]
      if (!report) return null
      path += (path ? ' ' : '') + report.path
    }
    return path || null
  }, [orderedTakenEdgeIds, pathReports, hiddenEdgeIds])

  useEffect(() => {
    if (graph.isPending || nodeExecutions.isPending) return
    setNodes(view.flowNodes)
    setEdges(view.flowEdges)
  }, [
    graph.isPending,
    nodeExecutions.isPending,
    setEdges,
    setNodes,
    view.flowEdges,
    view.flowNodes,
  ])

  const pending = graph.isPending || nodeCatalog.isPending || nodeExecutions.isPending
  const hasWarnings = view.externalStates.nodeIds.length > 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-100 px-5 py-2.5 text-[11px] font-medium text-slate-500">
        <span className="flex items-center gap-1.5">
          <i className="history-legend-line history-legend-line--path" />
          Participant path ({view.takenCount})
        </span>
        <span className="flex items-center gap-1.5">
          <i className="history-legend-line" />
          Other routes
        </span>
        <span className="flex items-center gap-1.5">
          <i className="history-legend-node" />
          Visited node ({view.visitedCount})
        </span>
        {currentState && (
          <span className="flex items-center gap-1.5 text-[#9929EA]">
            ● Current state: {currentState}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <select
            value={edgePathType}
            onChange={(e) => setEdgePathType(e.target.value as EdgePathType)}
            className="ml-auto h-7 cursor-pointer rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] font-semibold text-slate-600 transition-colors outline-none hover:bg-slate-50"
            title="Edge path style"
          >
            <option value="default">Bezier</option>
            <option value="smoothstep">Smooth</option>
            <option value="step">Step</option>
            <option value="straight">Straight</option>
          </select>
          <button
            type="button"
            className="inline-flex h-7 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-slate-600 transition-colors hover:bg-slate-50"
            onClick={() => flowInstance?.fitView({ padding: 0.2, duration: 240 })}
            title="Fit view"
            aria-label="Fit view"
          >
            <Maximize size={13} />
          </button>
          <button
            type="button"
            className={`inline-flex h-7 items-center justify-center rounded-lg border px-2 transition-colors ${showMiniMap ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setShowMiniMap((v) => !v)}
            title="Toggle minimap"
            aria-label="Toggle minimap"
          >
            <MapPin size={13} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {hasWarnings && (
          <div className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <CircleAlert size={14} className="mt-0.5 shrink-0" />
            <div>
              <strong>States outside the simulation nodes</strong>
              <p className="mt-0.5 leading-relaxed">
                {view.externalStates.nodeIds.length > 0 && (
                  <>
                    Node reference(s) not present in this version:{' '}
                    {view.externalStates.nodeIds.join(', ')}.{' '}
                  </>
                )}
                These node executions cannot be mapped onto the flow.
              </p>
            </div>
          </div>
        )}
        <div className="min-h-0 flex-1">
          {pending ? (
            <LoadingState />
          ) : view.flowNodes.length === 0 ? (
            <EmptyState
              title="No flow data"
              description="No nodes were recorded for this simulation version."
            />
          ) : (
            <div className="graph history-flow-canvas">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeRenderers}
                edgeTypes={edgeRenderers}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onInit={setFlowInstance}
                fitView={false}
                minZoom={STUDIO_MIN_ZOOM}
                maxZoom={STUDIO_MAX_ZOOM}
                nodesDraggable
                nodesConnectable={false}
                elementsSelectable={false}
              >
                <Background color="#cbd5e1" gap={20} size={1} />
                <Controls
                  showInteractive={false}
                  className="border-slate-200 bg-white fill-current text-slate-700 shadow-md"
                />
                <ZoomSliderPanel />
                {showMiniMap && <MiniMap className="border-slate-200 bg-white shadow-md" />}
                <NodeSearch
                  position="top-left"
                  placeholder="Search nodes... ⌘K"
                  className="ml-2 w-[320px] shadow-lg md:min-w-[320px]"
                />
                <ParticipantFocusViewport focusNodeId={view.focusNodeId} nodeCount={nodes.length} />
                <PathTravelingDot path={combinedPath} color={PATH_COLOR} />
              </ReactFlow>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
