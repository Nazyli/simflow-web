import { useQuery } from '@tanstack/react-query'
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react'
import { CircleAlert, Route } from 'lucide-react'
import dagre from 'dagre'
import { useEffect, useMemo, useState } from 'react'
import { type EdgePathType } from '../../components/button-edge'
import { getNodeExecutions } from '../../shared/api/executions'
import { getNodeCatalog } from '../../shared/api/node-catalog'
import { getGraph, type ApiEdge, type ApiNode } from '../../shared/api/workflows'
import { EmptyState, LoadingState } from '../../shared/components/async-state'
import type { NodeDefinition } from '../../shared/types/workflow'
import { WorkflowGraphNode } from '../simulation_studio/workflow-graph-node'
import { WorkflowGraphEdge } from '../simulation_studio/workflow-graph-edge'

const nodeRenderers = { workflow: WorkflowGraphNode }
const edgeRenderers = { workflow: WorkflowGraphEdge }
const MASTER_COLOR = '#94a3b8'
const PATH_COLOR = '#dc2626'

function dagLayout(
  apiNodes: ApiNode[],
  apiEdges: ApiEdge[],
): Map<string, { x: number; y: number }> {
  const nodeIds = new Set(apiNodes.map((n) => n.node_id))
  const graph = new dagre.graphlib.Graph()
  graph.setGraph({
    rankdir: 'LR',
    nodesep: 130,
    ranksep: 200,
    marginx: 60,
    marginy: 60,
  })
  graph.setDefaultEdgeLabel(() => ({}))
  apiNodes.forEach((node) => graph.setNode(node.node_id, { width: 200, height: 90 }))
  apiEdges.forEach((edge) => {
    if (!nodeIds.has(edge.source_node_id) || !nodeIds.has(edge.target_node_id)) return
    graph.setEdge(edge.source_node_id, edge.target_node_id)
  })
  dagre.layout(graph)
  const positions = new Map<string, { x: number; y: number }>()
  apiNodes.forEach((node) => {
    const meta = graph.node(node.node_id)
    if (!meta) return
    positions.set(node.node_id, {
      x: meta.x - meta.width / 2,
      y: meta.y - meta.height / 2,
    })
  })
  return positions
}

export function ParticipantFlowCanvas({
  versionId,
  executionId,
  currentState,
}: {
  versionId: string
  executionId: string
  currentState: string | null
}) {
  const graph = useQuery({
    queryKey: ['graph', versionId],
    queryFn: () => getGraph(versionId),
    enabled: Boolean(versionId),
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

  const view = useMemo(() => {
    const apiNodes: ApiNode[] = graph.data?.[0] ?? []
    const apiEdges: ApiEdge[] = graph.data?.[1] ?? []
    const definitions = new Map(
      (nodeCatalog.data?.nodes ?? []).map((definition: NodeDefinition) => [
        definition.node_type,
        definition,
      ]),
    )
    const nodeById = new Map(apiNodes.map((node) => [node.node_id, node]))
    const layout = dagLayout(apiNodes, apiEdges)

    const referencedIds = new Set<string>()
    for (const item of nodeExecutions.data ?? []) referencedIds.add(item.node_id)

    const visitedNodeIds = new Set<string>()
    const externalNodeIds = new Set<string>()
    for (const id of referencedIds) {
      if (nodeById.has(id)) visitedNodeIds.add(id)
      else externalNodeIds.add(id)
    }

    const takenEdgeIds = new Set<string>()
    for (const item of nodeExecutions.data ?? []) {
      if (item.selected_edge_id) takenEdgeIds.add(item.selected_edge_id)
    }

    const flowNodes: Node[] = apiNodes.map((node) => {
      const definition = definitions.get(node.node_type)
      const visited = visitedNodeIds.has(node.node_id)
      return {
        id: node.node_id,
        type: 'workflow',
        position:
          node.position_x !== null && node.position_y !== null
            ? { x: node.position_x, y: node.position_y }
            : (layout.get(node.node_id) ?? { x: 80, y: 80 }),
        className: visited
          ? `history-node-visited${node.node_id === currentState ? ' history-node-current' : ''}`
          : 'history-node-unvisited',
        data: {
          label: node.node_name,
          nodeType: node.node_type,
          color: definition?.color ?? '#64748b',
          inputPorts: node.input_ports,
          outputPorts: node.output_ports,
          rotation: node.rotation ?? 0,
        },
      }
    })

    const flowEdges: Edge[] = apiEdges.map((edge) => {
      const taken = takenEdgeIds.has(edge.edge_id)
      const color = taken ? PATH_COLOR : MASTER_COLOR
      const sourcePort = nodeById
        .get(edge.source_node_id)
        ?.output_ports.find((port) => port.id === edge.source_port_id)
      return {
        id: edge.edge_id,
        type: 'workflow',
        source: edge.source_node_id,
        sourceHandle: edge.source_port_id,
        target: edge.target_node_id,
        targetHandle: edge.target_port_id,
        markerEnd: { type: MarkerType.ArrowClosed, color },
        animated: taken,
        data: {
          label: sourcePort?.label ?? edge.source_port_id,
          style: {
            color,
            line_style: taken ? 'solid' : 'dashed',
            animated: taken,
          },
          edgeType: edgePathType,
        },
      }
    })

    return {
      flowNodes,
      flowEdges,
      visitedCount: visitedNodeIds.size,
      takenCount: takenEdgeIds.size,
      externalStates: { nodeIds: [...externalNodeIds] },
    }
  }, [currentState, edgePathType, graph.data, nodeCatalog.data, nodeExecutions.data])

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

  useEffect(() => {
    if (!flowInstance || nodes.length === 0) return
    const frame = requestAnimationFrame(() => flowInstance.fitView({ padding: 0.2, duration: 240 }))
    return () => cancelAnimationFrame(frame)
  }, [flowInstance, nodes.length])

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
          Workflow definition
        </span>
        <span className="flex items-center gap-1.5">
          <i className="history-legend-node" />
          Visited node ({view.visitedCount})
        </span>
        {currentState && (
          <span className="flex items-center gap-1.5 text-[#5b46c5]">
            ● Current state: {currentState}
          </span>
        )}
        <select
          value={edgePathType}
          onChange={(e) => setEdgePathType(e.target.value as EdgePathType)}
          className="ml-auto h-7 cursor-pointer rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] font-semibold text-slate-600 transition-colors outline-none hover:bg-slate-50"
        >
          <option value="default">Bezier</option>
          <option value="smoothstep">Smooth</option>
          <option value="step">Step</option>
          <option value="straight">Straight</option>
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {hasWarnings && (
          <div className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <CircleAlert size={14} className="mt-0.5 shrink-0" />
            <div>
              <strong>States outside the workflow nodes</strong>
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
        <div className="p-4">
          {pending ? (
            <LoadingState />
          ) : view.flowNodes.length === 0 ? (
            <EmptyState
              title="No flow data"
              description="No nodes were recorded for this workflow version."
            />
          ) : (
            <div className="history-flow-canvas">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeRenderers}
                edgeTypes={edgeRenderers}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onInit={setFlowInstance}
                fitView
                nodesDraggable
                nodesConnectable={false}
                elementsSelectable={false}
              >
                <Background color="#cbd5e1" gap={20} size={1} />
                <Controls
                  showInteractive={false}
                  className="border-slate-200 bg-white fill-current text-slate-700 shadow-md"
                />
              </ReactFlow>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
