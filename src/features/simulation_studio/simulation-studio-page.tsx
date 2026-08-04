import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Background, Controls, MarkerType, MiniMap, ReactFlow, useEdgesState, useNodesState, type Connection, type Edge, type Node, type ReactFlowInstance } from '@xyflow/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  CheckCircle2, ClipboardCheck, Maximize, Minus, PanelLeftClose, Play, Plus, 
  Save, Undo2, Redo2, CircleDot, ChevronRight, Sliders, History, 
  FolderKanban, Layers, X, AlertTriangle, Edit3, Trash2, MapPin
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import dagre from 'dagre'
import { ApiError } from '../../shared/api/client'
import { deleteExecution, getExecutions, getTimeline } from '../../shared/api/executions'
import { getNodeCatalog } from '../../shared/api/node-catalog'
import { addNode, addWorkflowEdge, createDraftFromVersion, createWorkflow, deleteNode, deleteWorkflow, deleteWorkflowEdge, deleteWorkflowVersion, getGraph, getWorkflowVersions, getWorkflows, publishVersion, updateNode, updateWorkflow, updateWorkflowEdge, type ApiEdge, type ApiNode } from '../../shared/api/workflows'
import { LoadingState } from '../../shared/components/async-state'
import { StatusBadge } from '../../shared/components/status-badge'
import type { Execution, NodeDefinition, OutputPort, Workflow } from '../../shared/types/workflow'
import { EdgeConfigurationForm, NodeConfigurationForm } from './node-configuration-form'
import { WorkflowGraphEdge } from './workflow-graph-edge'
import { WorkflowGraphNode } from './workflow-graph-node'

const emptyNodes: ApiNode[] = []
const emptyEdges: ApiEdge[] = []

const workflowNodeRenderers = { workflow: WorkflowGraphNode }
const workflowEdgeRenderers = { workflow: WorkflowGraphEdge }

function nodeToFlow(node: ApiNode, definition: NodeDefinition | undefined): Node { return { id: node.node_id, type: 'workflow', position: { x: node.position_x ?? 80, y: node.position_y ?? 80 }, data: { label: node.node_name, nodeType: node.node_type, color: definition?.color ?? '#64748b', inputPorts: node.input_ports, outputPorts: node.output_ports } } }
function edgeToFlow(edge: ApiEdge, sourcePort: OutputPort | undefined, onDelete: (edgeId: string) => void): Edge { const style = sourcePort?.edge_style ?? { color: '#94a3b8', line_style: 'solid', animated: false }; return { id: edge.edge_id, type: 'workflow', source: edge.source_node_id, sourceHandle: edge.source_port_id, target: edge.target_node_id, targetHandle: edge.target_port_id, markerEnd: { type: MarkerType.ArrowClosed, color: style.color }, animated: style.animated, data: { priority: edge.priority, label: sourcePort?.label ?? edge.source_port_id, style, onDelete } } }

function publishErrors(error: Error | null): string[] {
  if (!(error instanceof ApiError)) return []
  try {
    const info = JSON.parse(error.message).info
    return typeof info?.message === 'string' ? [info.message] : []
  } catch {
    return []
  }
}

function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    try {
      const info = JSON.parse(error.message).info
      if (typeof info?.message === 'string') return info.message
    } catch {
      // fall through to raw message
    }
    return error.message
  }
  return error instanceof Error ? error.message : 'Unknown error.'
}

export function SimulationStudioPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // State management
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [versionId, setVersionId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)
  const [deleteExecutionTarget, setDeleteExecutionTarget] = useState<string | null>(null)
  const [deleteVersionTarget, setDeleteVersionTarget] = useState<string | null>(null)
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [validationRequested, setValidationRequested] = useState(false)
  const [workflowPickerOpen, setWorkflowPickerOpen] = useState(false)
  const [editWorkflowOpen, setEditWorkflowOpen] = useState(false)
  
  // UI Sidebars & Tabs
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [activeRightTab, setActiveRightTab] = useState<'inspector' | 'versions' | 'executions'>('inspector')

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Cache node positions locally so React Query refetches don't reset user-arranged layout
  const localPositions = useRef<Map<string, { x: number; y: number }>>(new Map())
  const pendingEdgeKeys = useRef<Set<string>>(new Set())
  const fittedVersionId = useRef<string | null>(null)

  // Stable refs for persistNode.mutate and version status — kept in sync after mutations are declared below.
  // Using refs avoids adding them as useEffect dependencies (which would cause infinite loops).
  const persistNodeRef = useRef<(args: { id: string; payload: Omit<ApiNode, 'node_id' | 'category' | 'input_ports' | 'output_ports'> }) => void>(() => {})
  const selectedVersionStatusRef = useRef<string | undefined>(undefined)

  // API Queries & Mutations
  const workflows = useQuery({ queryKey: ['workflows'], queryFn: getWorkflows })
  const graph = useQuery({ queryKey: ['graph', versionId], queryFn: () => getGraph(versionId!), enabled: Boolean(versionId) })
  const nodeCatalog = useQuery({ queryKey: ['node-catalog'], queryFn: getNodeCatalog })
  const versions = useQuery({ queryKey: ['workflow-versions', selectedWorkflow?.workflow_id], queryFn: () => getWorkflowVersions(selectedWorkflow!.workflow_id), enabled: Boolean(selectedWorkflow) })
  const executions = useQuery({ queryKey: ['executions', versionId], queryFn: () => getExecutions(versionId!), enabled: Boolean(versionId) })
  const executionTimeline = useQuery({ queryKey: ['execution-timeline', selectedExecutionId], queryFn: () => getTimeline(selectedExecutionId!), enabled: Boolean(selectedExecutionId) })

  const create = useMutation({ mutationFn: createWorkflow, onSuccess: (workflow) => { setSelectedWorkflow(workflow); setEditWorkflowOpen(false); queryClient.invalidateQueries({ queryKey: ['workflows'] }) }, onError: (error) => toast.error(apiErrorMessage(error)) })
  const update = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Pick<Workflow, 'workflow_name' | 'workflow_desc' | 'workspace_id'> }) => updateWorkflow(id, payload), onSuccess: (workflow) => { setSelectedWorkflow(workflow); setEditWorkflowOpen(false); queryClient.invalidateQueries({ queryKey: ['workflows'] }) }, onError: (error) => toast.error(apiErrorMessage(error)) })
  const removeWorkflow = useMutation({ mutationFn: deleteWorkflow, onSuccess: () => { setSelectedWorkflow(null); setVersionId(null); setSelectedNodeId(null); setSelectedEdgeId(null); setNodes([]); setEdges([]); setEditWorkflowOpen(false); queryClient.invalidateQueries({ queryKey: ['workflows'] }) }, onError: (error) => toast.error(apiErrorMessage(error)) })
  
  const createDraft = useMutation({ mutationFn: async (_workflowId: string) => { const sourceVersion = selectedVersion ?? versions.data?.find((v) => v.status === 'published'); if (!sourceVersion) throw new Error('Select a published version before creating a draft.'); return createDraftFromVersion(sourceVersion.workflow_version_id) }, onSuccess: (version) => { setVersionId(version.workflow_version_id); setSelectedNodeId(null); setSelectedEdgeId(null); queryClient.invalidateQueries({ queryKey: ['workflow-versions', selectedWorkflow?.workflow_id] }) }, onError: (error) => toast.error(apiErrorMessage(error)) })
  const publish = useMutation({ mutationFn: publishVersion, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); queryClient.invalidateQueries({ queryKey: ['workflow-versions', selectedWorkflow?.workflow_id] }) }, onError: (error) => toast.error(apiErrorMessage(error)) })
  
  const addGraphNode = useMutation({ mutationFn: ({ definition, position }: { definition: NodeDefinition; position?: { x: number; y: number } }) => addNode(versionId!, { node_name: `${definition.label} node`, node_type: definition.node_type, parameters: { ...definition.parameters }, position_x: Math.round(position?.x ?? 180), position_y: Math.round(position?.y ?? 180) }), onSuccess: (node) => { setSelectedNodeId(node.node_id); setActiveRightTab('inspector'); setRightSidebarOpen(true); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) }, onError: (error) => toast.error(apiErrorMessage(error)) })
  const duplicateGraphNode = useMutation({ mutationFn: (node: ApiNode) => addNode(versionId!, { node_name: `${node.node_name} copy`, node_type: node.node_type, parameters: { ...node.parameters }, position_x: (node.position_x ?? 80) + 60, position_y: (node.position_y ?? 80) + 60 }), onSuccess: (node) => { setSelectedNodeId(node.node_id); setActiveRightTab('inspector'); setRightSidebarOpen(true); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) }, onError: (error) => toast.error(apiErrorMessage(error)) })
  const persistNode = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<ApiNode, 'node_id' | 'category' | 'input_ports' | 'output_ports'> }) => updateNode(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['graph', versionId] }), onError: (error) => toast.error(apiErrorMessage(error)) })
  const removeNode = useMutation({ mutationFn: deleteNode, onSuccess: () => { setSelectedNodeId(null); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) }, onError: (error) => toast.error(apiErrorMessage(error)) })
  const persistEdge = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<ApiEdge, 'edge_id' | 'is_valid'> }) => updateWorkflowEdge(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['graph', versionId] }), onError: (error) => toast.error(apiErrorMessage(error)) })
  const removeEdge = useMutation({ mutationFn: deleteWorkflowEdge, onSuccess: () => { setSelectedEdgeId(null); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) }, onError: (error) => toast.error(apiErrorMessage(error)) })
  const removeExecution = useMutation({ mutationFn: deleteExecution, onSuccess: (_result, executionId) => { if (selectedExecutionId === executionId) setSelectedExecutionId(null); queryClient.invalidateQueries({ queryKey: ['executions', versionId] }); toast.success('Execution log deleted.') }, onError: (error) => toast.error(apiErrorMessage(error)) })
  const removeVersion = useMutation({ mutationFn: deleteWorkflowVersion, onSuccess: (_result, deletedVersionId) => { if (versionId === deletedVersionId) { setVersionId(null); setSelectedNodeId(null); setSelectedEdgeId(null); setSelectedExecutionId(null); setNodes([]); setEdges([]); localPositions.current.clear() } queryClient.invalidateQueries({ queryKey: ['workflow-versions', selectedWorkflow?.workflow_id] }); queryClient.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Workflow version deleted.') }, onError: (error) => toast.error(apiErrorMessage(error)) })
  const removeEdgeRef = useRef(removeEdge)
  removeEdgeRef.current = removeEdge
  const deleteEdge = useCallback((edgeId: string) => { removeEdgeRef.current.mutate(edgeId) }, [])

  const apiNodes = graph.data?.[0] ?? emptyNodes
  const apiEdges = graph.data?.[1] ?? emptyEdges
  const definitions = useMemo(() => new Map((nodeCatalog.data?.nodes ?? []).map((definition) => [definition.node_type, definition])), [nodeCatalog.data])
  const selectedNode = useMemo(() => apiNodes.find((node) => node.node_id === selectedNodeId) ?? null, [apiNodes, selectedNodeId])
  const selectedEdge = useMemo(() => apiEdges.find((edge) => edge.edge_id === selectedEdgeId) ?? null, [apiEdges, selectedEdgeId])
  const selectedVersion = versions.data?.find((version) => version.workflow_version_id === versionId)
  const selectedExecution = executions.data?.find((execution) => execution.execution_id === selectedExecutionId) ?? null
  const validationErrors = useMemo(() => publishErrors(publish.error), [publish.error])
  const invalidNodeIds = useMemo(() => new Set(validationErrors.flatMap((error) => [...error.matchAll(/Node '([^']+)'/g)].map((match) => match[1]))), [validationErrors])
  const invalidEdgeIds = useMemo(() => new Set(validationErrors.flatMap((error) => [...error.matchAll(/Edge '([^']+)'/g)].map((match) => match[1]))), [validationErrors])

  // Keep stable refs in sync with latest values
  persistNodeRef.current = persistNode.mutate
  selectedVersionStatusRef.current = selectedVersion?.status

  // Select first available workflow automatically if none selected
  useEffect(() => {
    if (!selectedWorkflow && workflows.data && workflows.data.length > 0) {
      setSelectedWorkflow(workflows.data[0])
    }
  }, [workflows.data, selectedWorkflow])

  // Select first version automatically when workflow versions load
  useEffect(() => {
    if (versions.data && versions.data.length > 0 && !versionId) {
      const draft = versions.data.find(v => v.status === 'draft')
      setVersionId(draft ? draft.workflow_version_id : versions.data[0].workflow_version_id)
    }
  }, [versions.data, versionId])

  // Automatically focus Inspector tab when node or edge is selected
  useEffect(() => {
    if (selectedNodeId || selectedEdgeId) {
      setActiveRightTab('inspector')
      setRightSidebarOpen(true)
    }
  }, [selectedNodeId, selectedEdgeId])

  // Sync React Flow nodes when graph data loads or changes.
  // Positions are cached in localPositions ref; only new nodes get auto-layout.
  useEffect(() => {
    if (apiNodes.length === 0) {
      setNodes([])
      setEdges(apiEdges.map((edge) => edgeToFlow(edge, apiNodes.find((node) => node.node_id === edge.source_node_id)?.output_ports.find((port) => port.id === edge.source_port_id), deleteEdge)))
      return
    }

    // Detect nodes that genuinely lack a position in the API response
    const nodesNeedingLayout: string[] = []
    apiNodes.forEach((node) => {
      if (node.position_x === null || node.position_y === null) {
        nodesNeedingLayout.push(node.node_id)
      } else {
        // Update cache with latest API position (API is source of truth for saved positions)
        localPositions.current.set(node.node_id, { x: node.position_x, y: node.position_y })
      }
    })

    // Build a dagre layout and use it only for nodes that truly have no position
    if (nodesNeedingLayout.length > 0) {
      const dagreGraph = new dagre.graphlib.Graph()
      dagreGraph.setGraph({ rankdir: 'LR', nodesep: 130, ranksep: 200, marginx: 60, marginy: 60 })
      dagreGraph.setDefaultEdgeLabel(() => ({}))
      const nodeIds = new Set(apiNodes.map((n) => n.node_id))
      apiNodes.forEach((node) => dagreGraph.setNode(node.node_id, { width: 200, height: 90 }))
      apiEdges.forEach((edge) => {
        if (!nodeIds.has(edge.source_node_id) || !nodeIds.has(edge.target_node_id)) return
        dagreGraph.setEdge(edge.source_node_id, edge.target_node_id)
      })
      dagre.layout(dagreGraph)

      // Assign dagre positions and cache them
      nodesNeedingLayout.forEach((nodeId) => {
        const meta = dagreGraph.node(nodeId)
        if (!meta) return
        const pos = { x: meta.x - meta.width / 2, y: meta.y - meta.height / 2 }
        localPositions.current.set(nodeId, pos)
      })

      // Persist auto-layout positions to DB so they are saved for next session.
      // Deferred with setTimeout to avoid calling mutate during the render phase.
      // Runs for all version statuses — if the API rejects (e.g. immutable version), it fails silently.
      const nodesToSave = apiNodes.filter((n) => nodesNeedingLayout.includes(n.node_id))
      setTimeout(() => {
        nodesToSave.forEach((node) => {
          const pos = localPositions.current.get(node.node_id)
          if (!pos || !persistNodeRef.current) return
          persistNodeRef.current({
            id: node.node_id,
            payload: {
              node_name: node.node_name,
              node_type: node.node_type,
              parameters: node.parameters,
              position_x: pos.x,
              position_y: pos.y,
            },
          })
        })
      }, 0)
    }

    // Build React Flow nodes using cached positions
    setNodes(apiNodes.map((node) => {
      const cached = localPositions.current.get(node.node_id)
      return {
        ...nodeToFlow(node, definitions.get(node.node_type)),
        position: cached ?? { x: node.position_x ?? 100, y: node.position_y ?? 100 },
      }
    }))
    setEdges(apiEdges.map((edge) => edgeToFlow(edge, apiNodes.find((node) => node.node_id === edge.source_node_id)?.output_ports.find((port) => port.id === edge.source_port_id), deleteEdge)))
  }, [apiNodes, apiEdges, definitions, setNodes, setEdges, deleteEdge])

  useEffect(() => {
    if (!flowInstance || !versionId || apiNodes.length === 0 || fittedVersionId.current === versionId) return
    fittedVersionId.current = versionId
    const frame = requestAnimationFrame(() => flowInstance.fitView({ padding: 0.2, duration: 240 }))
    return () => cancelAnimationFrame(frame)
  }, [apiNodes.length, flowInstance, versionId])

  useEffect(() => { setSelectedExecutionId(null); localPositions.current.clear() }, [versionId])

  useEffect(() => {
    const miniMap = document.querySelector<HTMLElement>('.graph .react-flow__minimap')
    if (miniMap) miniMap.style.display = showMiniMap ? '' : 'none'
  }, [showMiniMap])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodeId && selectedVersion?.status === 'draft') { event.preventDefault(); removeNode.mutate(selectedNodeId); return }
        if (selectedEdgeId && selectedVersion?.status === 'draft') { event.preventDefault(); removeEdge.mutate(selectedEdgeId) }
      }
      if (event.key === ' ' && target?.closest('.graph')) {
        document.documentElement.classList.add('canvas-pan-active')
      }
    }
    const onKeyUp = (event: KeyboardEvent) => { if (event.key === ' ') document.documentElement.classList.remove('canvas-pan-active') }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [removeEdge, removeNode, selectedEdgeId, selectedNodeId, selectedVersion?.status])

  useEffect(() => {
    function acceptPaletteDrop(event: globalThis.DragEvent) {
      if (!(event.target instanceof Element) || !event.target.closest('.graph') || !flowInstance || !versionId || selectedVersion?.status !== 'draft') return
      const nodeType = event.dataTransfer?.getData('application/simflow-node-type')
      const definition = definitions.get(nodeType ?? '')
      if (!definition) return
      event.preventDefault(); event.stopPropagation()
      addGraphNode.mutate({ definition, position: flowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY }) })
    }
    function allowPaletteDrop(event: globalThis.DragEvent) {
      if (event.target instanceof Element && event.target.closest('.graph') && event.dataTransfer?.types.includes('application/simflow-node-type')) event.preventDefault()
    }
    document.addEventListener('dragover', allowPaletteDrop, true)
    document.addEventListener('drop', acceptPaletteDrop, true)
    return () => { document.removeEventListener('dragover', allowPaletteDrop, true); document.removeEventListener('drop', acceptPaletteDrop, true) }
  }, [addGraphNode, definitions, flowInstance, selectedVersion?.status, versionId])

  function submitWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = { workflow_name: String(form.get('name')), workflow_desc: String(form.get('description')) || null, workspace_id: null }
    if (selectedWorkflow) update.mutate({ id: selectedWorkflow.workflow_id, payload })
    else create.mutate(payload)
  }

  function connect(connection: Connection) {
    if (!versionId || selectedVersion?.status !== 'draft' || !connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) return
    const connectionKey = [connection.source, connection.sourceHandle, connection.target, connection.targetHandle].join(':')
    if (pendingEdgeKeys.current.has(connectionKey)) return
    if (connection.source === connection.target) { toast.error('A node cannot connect to itself.'); return }
    if (apiEdges.some((edge) => edge.source_node_id === connection.source && edge.source_port_id === connection.sourceHandle && edge.target_node_id === connection.target && edge.target_port_id === connection.targetHandle)) { toast.error('That port connection already exists.'); return }
    const sourceNode = apiNodes.find((node) => node.node_id === connection.source)
    const targetNode = apiNodes.find((node) => node.node_id === connection.target)
    const sourcePort = sourceNode?.output_ports.find((port) => port.id === connection.sourceHandle)
    const targetPort = targetNode?.input_ports.find((port) => port.id === connection.targetHandle)
    if (!sourcePort || !targetPort) { toast.error('Select a catalog-defined output port and input port.'); return }
    if (sourcePort.data_type !== 'any' && !targetPort.accepted_data_types.includes('any') && !targetPort.accepted_data_types.includes(sourcePort.data_type)) { toast.error('The selected ports have incompatible data types.'); return }
    if (apiEdges.filter((edge) => edge.source_node_id === connection.source && edge.source_port_id === connection.sourceHandle).length >= sourcePort.max_connections) { toast.error('The source output port has reached its connection limit.'); return }
    if (apiEdges.filter((edge) => edge.target_node_id === connection.target && edge.target_port_id === connection.targetHandle).length >= targetPort.max_connections) { toast.error('The target input port has reached its connection limit.'); return }
    const adjacency = new Map<string, string[]>()
    apiEdges.forEach((edge) => adjacency.set(edge.source_node_id, [...(adjacency.get(edge.source_node_id) ?? []), edge.target_node_id]))
    const pending = [connection.target]; const visited = new Set<string>()
    while (pending.length) { const nodeId = pending.pop()!; if (nodeId === connection.source) { toast.error('That connection would create a cycle.'); return }; if (!visited.has(nodeId)) { visited.add(nodeId); pending.push(...(adjacency.get(nodeId) ?? [])) } }
    const pendingEdgeId = `pending:${connectionKey}`
    const pendingEdge: ApiEdge = { edge_id: pendingEdgeId, source_node_id: connection.source, source_port_id: connection.sourceHandle, target_node_id: connection.target, target_port_id: connection.targetHandle, priority: 0, is_valid: true }
    pendingEdgeKeys.current.add(connectionKey)
    setEdges((current) => [...current, edgeToFlow(pendingEdge, sourcePort, deleteEdge)])
    addWorkflowEdge(versionId, { source_node_id: connection.source, source_port_id: connection.sourceHandle, target_node_id: connection.target, target_port_id: connection.targetHandle, priority: 0 })
      .then((edge) => {
        queryClient.setQueryData<[ApiNode[], ApiEdge[]]>(['graph', versionId], (current) => current ? [current[0], [...current[1].filter((item) => item.edge_id !== edge.edge_id), edge]] : current)
        setEdges((current) => current.map((item) => item.id === pendingEdgeId ? edgeToFlow(edge, sourcePort, deleteEdge) : item))
      })
      .catch((error: unknown) => {
        setEdges((current) => current.filter((item) => item.id !== pendingEdgeId))
        toast.error(apiErrorMessage(error))
      })
      .finally(() => {
        pendingEdgeKeys.current.delete(connectionKey)
        queryClient.invalidateQueries({ queryKey: ['graph', versionId] })
      })
  }

  function applyAutoLayout() {
    if (!versionId || selectedVersion?.status !== 'draft' || apiNodes.length === 0) return
    const layout = new dagre.graphlib.Graph()
    layout.setGraph({ rankdir: 'LR', nodesep: 130, ranksep: 200, marginx: 60, marginy: 60 })
    layout.setDefaultEdgeLabel(() => ({}))
    apiNodes.forEach((node) => layout.setNode(node.node_id, { width: 200, height: 90 }))
    apiEdges.forEach((edge) => layout.setEdge(edge.source_node_id, edge.target_node_id))
    dagre.layout(layout)
    const positions = new Map<string, { x: number; y: number }>()
    apiNodes.forEach((node) => {
      const meta = layout.node(node.node_id)
      if (meta) positions.set(node.node_id, { x: meta.x - meta.width / 2, y: meta.y - meta.height / 2 })
    })
    positions.forEach((position, nodeId) => localPositions.current.set(nodeId, position))
    setNodes((current) => current.map((node) => ({ ...node, position: positions.get(node.id) ?? node.position })))
    apiNodes.forEach((node) => {
      const position = positions.get(node.node_id)
      if (position) persistNode.mutate({ id: node.node_id, payload: { node_name: node.node_name, node_type: node.node_type, parameters: node.parameters, position_x: position.x, position_y: position.y } })
    })
    requestAnimationFrame(() => flowInstance?.fitView({ padding: 0.2, duration: 240 }))
  }

  function startPaletteDrag(event: DragEvent<HTMLDivElement>, nodeType: string) {
    event.dataTransfer.setData('application/simflow-node-type', nodeType)
    event.dataTransfer.setData('text/plain', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  function allowCanvasDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function dropPaletteNode(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const definition = definitions.get(event.dataTransfer.getData('application/simflow-node-type'))
    if (!definition || !flowInstance || !versionId || selectedVersion?.status !== 'draft') return
    addGraphNode.mutate({ definition, position: flowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY }) })
  }

  function saveStructuredNode(name: string, parameters: Record<string, unknown>) {
    if (!selectedNode) return
    persistNode.mutate({ id: selectedNode.node_id, payload: { node_name: name, node_type: selectedNode.node_type, parameters, position_x: selectedNode.position_x, position_y: selectedNode.position_y } })
  }

  function saveStructuredEdge(priority: number) {
    if (!selectedEdge) return
    persistEdge.mutate({ id: selectedEdge.edge_id, payload: { source_node_id: selectedEdge.source_node_id, source_port_id: selectedEdge.source_port_id, target_node_id: selectedEdge.target_node_id, target_port_id: selectedEdge.target_port_id, priority } })
  }

  function validateGraph() { setValidationRequested(true) }

  return (
    <div className="studio-app-container flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 text-slate-800">
      {/* Studio Header Bar */}
      <header className="studio-top-header flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            onClick={() => setLeftSidebarOpen(prev => !prev)}
            title={leftSidebarOpen ? "Collapse left sidebar" : "Expand left sidebar"}
          >
            <PanelLeftClose size={16} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-purple-700 font-bold px-2 py-0.5 rounded bg-purple-50 border border-purple-200">Studio</span>
            <button 
              className="flex items-center gap-2 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors"
              type="button" 
              onClick={() => setWorkflowPickerOpen(true)}
            >
              <h1 className="text-base font-bold text-slate-900">{selectedWorkflow?.workflow_name ?? 'Select Workflow'}</h1>
              <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
            </button>
            {selectedWorkflow && (
              <button 
                type="button"
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                onClick={() => setEditWorkflowOpen(true)}
                title="Edit workflow details"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200">
            {selectedVersion ? <StatusBadge status={selectedVersion.status} /> : <span className="inline-flex h-5 w-fit items-center rounded-4xl border border-transparent px-2 text-[0.66rem] font-bold capitalize" style={{ color: 'var(--status-draft)', backgroundColor: 'var(--status-draft-bg)' }}>No Version</span>}
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Save size={13} className="text-emerald-600" /> Autosaved
            </span>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {selectedWorkflow && (
            <div className="hidden md:flex items-center gap-1.5 mr-2 bg-slate-100 border border-slate-200 rounded-lg p-1">
              <select 
                className="bg-transparent text-xs text-slate-700 font-medium px-2 py-1 focus:outline-none cursor-pointer"
                value={versionId ?? ''} 
                onChange={(event) => { setVersionId(event.target.value || null); setSelectedNodeId(null); setSelectedEdgeId(null) }}
              >
                <option value="" className="bg-white">Select version...</option>
                {versions.data?.map((v) => (
                  <option key={v.workflow_version_id} value={v.workflow_version_id} className="bg-white">
                    v{v.version_number} — {v.status}
                  </option>
                ))}
              </select>
              {selectedVersion?.status !== 'draft' && (
                <button 
                  type="button" 
                  className="flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-purple-700"
                  onClick={() => createDraft.mutate(selectedWorkflow.workflow_id)}
                >
                  <Plus className="w-3 h-3" /> New Draft
                </button>
              )}
            </div>
          )}

          <button 
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 disabled:opacity-50" 
            type="button" 
            disabled={!selectedVersion || selectedVersion.status !== 'draft' || publish.isPending} 
            onClick={() => selectedVersion && publish.mutate(selectedVersion.workflow_version_id)}
          >
            <CheckCircle2 size={14} /> Publish
          </button>

          <button 
            type="button" 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors shadow-xs"
            onClick={() => navigate('/simulation')}
          >
            <Play size={14} className="fill-purple-600 text-purple-600" /> Run Simulation
          </button>

          <button 
            type="button" 
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors ml-1"
            onClick={() => setRightSidebarOpen(prev => !prev)}
            title={rightSidebarOpen ? "Collapse inspector sidebar" : "Expand inspector sidebar"}
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </header>

      {/* Main Studio Workspace Grid */}
      <div className="studio-main-workspace flex flex-1 relative overflow-hidden">
        {/* Left Sidebar: Node Palette & Workflow List */}
        <aside className={`studio-left-sidebar flex flex-col bg-white border-r border-slate-200 transition-all duration-200 z-10 ${leftSidebarOpen ? 'w-72 min-w-[280px]' : 'w-0 min-w-0 opacity-0 overflow-hidden'}`}>
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600" /> Node Palette
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">Drag & Drop</span>
          </div>

          <div className="p-3 flex-1 overflow-y-auto space-y-2.5">
            <p className="text-xs text-slate-500 mb-2">Drag a component card onto the canvas or click to append.</p>
            
            {(nodeCatalog.data?.nodes ?? []).map((definition) => {
              const isDraft = Boolean(versionId && selectedVersion?.status === 'draft')
              
              return (
                <div 
                  key={definition.node_type}
                  draggable={isDraft}
                  onDragStart={(event) => startPaletteDrag(event, definition.node_type)}
                  onClick={() => isDraft && addGraphNode.mutate({ definition })}
                  style={{ borderColor: `${definition.color}55`, backgroundColor: `${definition.color}0d` }}
                  className={`palette-card-item p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                    isDraft ? 'hover:scale-[1.02] hover:shadow-md border-slate-200 opacity-100' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="p-1.5 rounded-lg bg-white shadow-xs" style={{ color: definition.color }}>
                      <CircleDot className="w-4 h-4" />
                    </div>
                    <strong className="text-sm font-semibold text-slate-800">{definition.label}</strong>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">{definition.description}</p>
                </div>
              )
            })}

            {!selectedVersion && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                Select or create a version to start editing nodes.
              </div>
            )}

            {/* Quick Workflows List */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-purple-600" /> Workflows
                </h3>
                <button 
                  className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                  onClick={() => { setSelectedWorkflow(null); setVersionId(null); setEditWorkflowOpen(true) }}
                >
                  + New
                </button>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {workflows.isPending && <LoadingState />}
                {workflows.data?.map((wf) => (
                  <button 
                    key={wf.workflow_id}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      selectedWorkflow?.workflow_id === wf.workflow_id ? 'bg-purple-50 text-purple-900 border border-purple-200 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    onClick={() => { setSelectedWorkflow(wf); setVersionId(null) }}
                  >
                    <span className="truncate">{wf.workflow_name}</span>
                    <StatusBadge status={wf.status} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Center Canvas Area */}
        <section className="studio-canvas-area flex-1 relative flex flex-col bg-slate-100/70">
          {/* Floating Canvas Glassmorphism Toolbar */}
          <div className="floating-canvas-toolbar absolute top-4 left-4 z-10 flex items-center gap-1.5 p-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-md">
            <div className="flex items-center gap-1 pr-1.5 border-r border-slate-200">
              <button type="button" className="inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 hover:bg-slate-100" aria-label="Undo" disabled title="Undo (Ctrl+Z)"><Undo2 size={15} /></button>
              <button type="button" className="inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 hover:bg-slate-100" aria-label="Redo" disabled title="Redo (Ctrl+Y)"><Redo2 size={15} /></button>
            </div>

            <div className="flex items-center gap-1 px-1 border-r border-slate-200">
              <button type="button" className="inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 hover:bg-slate-100" aria-label="Zoom Out" onClick={() => flowInstance?.zoomOut()} title="Zoom Out"><Minus size={15} /></button>
              <button type="button" className="inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 hover:bg-slate-100" aria-label="Zoom In" onClick={() => flowInstance?.zoomIn()} title="Zoom In"><Plus size={15} /></button>
              <button type="button" className="inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 hover:bg-slate-100" aria-label="Fit View" onClick={() => flowInstance?.fitView()} title="Fit Canvas View"><Maximize size={15} /></button>
              <button type="button" className="inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 hover:bg-slate-100" aria-label="Auto layout" onClick={applyAutoLayout} disabled={!versionId || selectedVersion?.status !== 'draft' || !apiNodes.length} title="Arrange nodes automatically"><Layers size={15} /></button>
            </div>

            <div className="flex items-center gap-1 pl-1">
              <button 
                type="button" 
                className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${showMiniMap ? 'text-purple-700 bg-purple-50' : 'text-slate-600 hover:bg-slate-100'}`} 
                onClick={() => setShowMiniMap(curr => !curr)} 
                title="Toggle Minimap"
              >
                <MapPin size={15} />
              </button>
              
              <button 
                type="button" 
                className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed px-2 gap-1 font-medium text-xs ${validationRequested ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:bg-slate-100'}`} 
                onClick={validateGraph}
                title="Validate Graph Structure"
              >
                <ClipboardCheck size={15} /> Validate
              </button>
            </div>
          </div>

          {/* Graph Validation Floating Error Drawer */}
          {validationErrors.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md z-20 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 shadow-xl backdrop-blur-md animate-slide-up">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> Graph Validation Errors
                </h3>
                <button className="text-red-500 hover:text-red-800" onClick={() => publish.reset()}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ul className="text-xs space-y-1 max-h-36 overflow-y-auto pl-4 list-disc text-red-700">
                {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {/* React Flow Canvas Container */}
          <div className="graph flex-1 w-full h-full border-none bg-slate-50" onDragOver={allowCanvasDrop} onDrop={dropPaletteNode}>
            <ReactFlow 
              nodeTypes={workflowNodeRenderers} 
              edgeTypes={workflowEdgeRenderers} 
              onInit={setFlowInstance} 
              nodes={nodes.map((node) => ({ 
                ...node, 
                className: invalidNodeIds.has(node.id) ? 'invalid-node' : '', 
                draggable: selectedVersion?.status === 'draft', 
                connectable: selectedVersion?.status === 'draft' 
              }))} 
              edges={edges.map((edge) => ({ 
                ...edge, 
                className: invalidEdgeIds.has(edge.id) || apiEdges.find((apiEdge) => apiEdge.edge_id === edge.id)?.is_valid === false ? 'invalid-edge' : '' 
              }))} 
              onNodesChange={onNodesChange} 
              onEdgesChange={onEdgesChange} 
              onConnect={connect} 
              onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null) }} 
              onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null) }} 
              onNodeDragStop={(_, node) => { 
                // Immediately update local cache so refetch doesn't undo the drag
                localPositions.current.set(node.id, { x: Math.round(node.position.x), y: Math.round(node.position.y) })
                if (selectedVersion?.status !== 'draft') return
                const current = apiNodes.find((item) => item.node_id === node.id)
                if (current) persistNode.mutate({ id: node.id, payload: { ...current, position_x: Math.round(node.position.x), position_y: Math.round(node.position.y) } }) 
              }} 
              fitView
            >
              <Background color="#cbd5e1" gap={20} size={1} />
              <Controls className="bg-white border-slate-200 text-slate-700 fill-current shadow-md" />
              <MiniMap className="bg-white border-slate-200 shadow-md" maskColor="rgba(241, 245, 249, 0.7)" />
            </ReactFlow>
          </div>
        </section>

        {/* Right Sidebar: Tabbed Inspector, Versions, Executions */}
        <aside className={`studio-right-sidebar flex flex-col bg-white border-l border-slate-200 transition-all duration-200 z-10 ${rightSidebarOpen ? 'w-80 min-w-[320px]' : 'w-0 min-w-0 opacity-0 overflow-hidden'}`}>
          {/* Tab Navigation */}
          <div className="right-sidebar-tabs flex border-b border-slate-200 bg-slate-50 p-1 gap-1">
            <button 
              type="button" 
              className={`tab-btn flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                activeRightTab === 'inspector' ? 'bg-white text-purple-700 border border-slate-200 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveRightTab('inspector')}
            >
              <Sliders className="w-3.5 h-3.5" /> Inspector
            </button>

            <button 
              type="button" 
              className={`tab-btn flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                activeRightTab === 'versions' ? 'bg-white text-purple-700 border border-slate-200 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveRightTab('versions')}
            >
              <History className="w-3.5 h-3.5" /> Versions
            </button>

            <button 
              type="button" 
              className={`tab-btn flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                activeRightTab === 'executions' ? 'bg-white text-purple-700 border border-slate-200 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveRightTab('executions')}
            >
              <Play className="w-3.5 h-3.5" /> Log
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Inspector Tab */}
            {activeRightTab === 'inspector' && (
              <div className="space-y-4">
                {selectedNode && (
                  <NodeConfigurationForm 
                    node={{ ...selectedNode, configuration: selectedNode.parameters }} 
                    definition={definitions.get(selectedNode.node_type)}
                    onSave={saveStructuredNode} 
                    onDuplicate={() => duplicateGraphNode.mutate(selectedNode)} 
                    onDelete={() => removeNode.mutate(selectedNode.node_id)} 
                  />
                )}

                {selectedEdge && (
                  <EdgeConfigurationForm 
                    priority={selectedEdge.priority} 
                    onSave={saveStructuredEdge} 
                    onDelete={() => removeEdge.mutate(selectedEdge.edge_id)} 
                  />
                )}

                {!selectedNode && !selectedEdge && (
                  <div className="empty-inspector text-center py-10 px-4 text-slate-400">
                    <Sliders className="w-10 h-10 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-slate-700">Nothing Selected</p>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">Click any node or connection line on the canvas to configure parameters and conditions.</p>
                  </div>
                )}
              </div>
            )}

            {/* Versions Tab */}
            {activeRightTab === 'versions' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Workflow Versions</h3>
                  {selectedWorkflow && (
                    <button 
                      type="button" 
                      className="text-xs px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-1 shadow-xs"
                      onClick={() => createDraft.mutate(selectedWorkflow.workflow_id)}
                    >
                      <Plus className="w-3 h-3" /> Create Draft
                    </button>
                  )}
                </div>

                {selectedWorkflow && (
                  versions.isPending ? <LoadingState /> : (
                    <div className="space-y-2">
                      {versions.data?.map((version) => (
                        <div 
                          key={version.workflow_version_id}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            version.workflow_version_id === versionId ? 'bg-purple-50 border-purple-300 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => setVersionId(version.workflow_version_id)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-slate-800">Version {version.version_number}</span>
                            <span className="flex items-center gap-1.5 shrink-0">
                              <StatusBadge status={version.status} />
                              <button type="button" aria-label="Delete version" title="Delete version" onClick={(event) => { event.stopPropagation(); setDeleteVersionTarget(version.workflow_version_id) }} className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">Created: {new Date().toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Executions Tab */}
            {activeRightTab === 'executions' && (
              <ExecutionHistoryPanel 
                executions={executions.data ?? []} 
                selectedExecution={selectedExecution} 
                timeline={executionTimeline.data ?? []} 
                isLoading={executions.isLoading || executionTimeline.isLoading} 
                onSelect={setSelectedExecutionId} 
                onRequestDelete={setDeleteExecutionTarget}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Select / Create Workflow Dialog */}
      <Dialog open={workflowPickerOpen} onOpenChange={setWorkflowPickerOpen}>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-purple-600" /> Select Workflow
          </DialogTitle>
          <DialogDescription>
            Choose an existing workflow to edit or create a new simulation workflow.
          </DialogDescription>

          <Button 
            type="button" 
            className="w-full" 
            onClick={() => { setSelectedWorkflow(null); setVersionId(null); setWorkflowPickerOpen(false); setEditWorkflowOpen(true) }}
          >
            <Plus className="w-4 h-4" /> Create New Workflow
          </Button>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {workflows.data?.map((item) => (
              <button 
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedWorkflow?.workflow_id === item.workflow_id ? 'bg-purple-50 border-purple-300' : 'bg-white border-slate-200 hover:border-slate-300'
                }`} 
                type="button" 
                key={item.workflow_id} 
                onClick={() => { setSelectedWorkflow(item); setVersionId(null); setWorkflowPickerOpen(false) }}
              >
                <div>
                  <strong className="block text-sm font-semibold text-slate-800">{item.workflow_name}</strong>
                  <small className="text-xs text-slate-500 leading-normal">{item.workflow_desc ?? 'No description provided'}</small>
                </div>
                <StatusBadge status={item.status} />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit / Create Workflow Modal */}
      <Dialog open={editWorkflowOpen} onOpenChange={setEditWorkflowOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-purple-600" /> {selectedWorkflow ? 'Edit Workflow' : 'Create Workflow'}
          </DialogTitle>
          
          <form className="flex flex-col gap-4" key={selectedWorkflow?.workflow_id ?? 'new'} onSubmit={submitWorkflow}>
            <div className="grid gap-1.5">
              <Label htmlFor="workflow-name" className="text-slate-700">Workflow Name</Label>
              <Input id="workflow-name" name="name" required defaultValue={selectedWorkflow?.workflow_name ?? ''} placeholder="e.g. Customer Onboarding Engine" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="workflow-desc" className="text-slate-700">Description</Label>
              <Textarea id="workflow-desc" rows={3} name="description" defaultValue={selectedWorkflow?.workflow_desc ?? ''} placeholder="Describe the purpose of this simulation..." />
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <Button type="button" variant="outline" onClick={() => setEditWorkflowOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                <Save className="w-4 h-4" /> {selectedWorkflow ? 'Save Changes' : 'Create Workflow'}
              </Button>
            </div>

            {selectedWorkflow && (
              <div className="pt-4 border-t border-slate-200 mt-2">
                <Button 
                  type="button" 
                  variant="destructive" 
                  className="w-full" 
                  disabled={removeWorkflow.isPending} 
                  onClick={() => removeWorkflow.mutate(selectedWorkflow.workflow_id)}
                >
                  <Trash2 className="w-4 h-4" /> Delete Workflow
                </Button>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Execution Log Confirmation */}
      <Dialog open={Boolean(deleteExecutionTarget)} onOpenChange={(open) => { if (!open) setDeleteExecutionTarget(null) }}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" /> Delete execution log?
          </DialogTitle>
          <DialogDescription>
            This permanently deletes the execution, its timeline events, node results, waits, timers, and the simulation session when no other execution uses it. This cannot be undone.
          </DialogDescription>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteExecutionTarget(null)}>Cancel</Button>
            <Button 
              type="button" 
              variant="destructive" 
              disabled={removeExecution.isPending} 
              onClick={() => { if (deleteExecutionTarget) removeExecution.mutate(deleteExecutionTarget); setDeleteExecutionTarget(null) }} 
              className="border-0 bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="w-3.5 h-3.5" /> {removeExecution.isPending ? 'Deleting…' : 'Delete log'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Workflow Version Confirmation */}
      <Dialog open={Boolean(deleteVersionTarget)} onOpenChange={(open) => { if (!open) setDeleteVersionTarget(null) }}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" /> Delete workflow version?
          </DialogTitle>
          <DialogDescription>
            This permanently deletes the version, its nodes, and its edges. This cannot be undone. Versions that already have execution logs cannot be deleted.
          </DialogDescription>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteVersionTarget(null)}>Cancel</Button>
            <Button 
              type="button" 
              variant="destructive" 
              disabled={removeVersion.isPending} 
              onClick={() => { if (deleteVersionTarget) removeVersion.mutate(deleteVersionTarget); setDeleteVersionTarget(null) }} 
              className="border-0 bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="w-3.5 h-3.5" /> {removeVersion.isPending ? 'Deleting…' : 'Delete version'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ExecutionHistoryPanel({ executions, selectedExecution, timeline, isLoading, onSelect, onRequestDelete }: { executions: Execution[]; selectedExecution: Execution | null; timeline: { event_id: string; event_type: string; node_id: string | null; payload: Record<string, unknown> }[]; isLoading: boolean; onSelect: (executionId: string) => void; onRequestDelete: (executionId: string) => void }) {
  return (
    <div className="execution-history-panel space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
        <History className="w-4 h-4 text-purple-600" /> Execution Logs
      </h3>

      {isLoading && <LoadingState />}
      {executions.length === 0 && !isLoading && (
        <p className="text-xs text-slate-400 text-center py-4">No execution logs for this version.</p>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {executions.map((execution) => (
          <div
            className={`w-full cursor-pointer text-left p-2.5 rounded-xl border text-xs transition-all ${
              selectedExecution?.execution_id === execution.execution_id ? 'bg-purple-50 border-purple-300' : 'bg-white border-slate-200 hover:border-slate-300'
            }`} 
            key={execution.execution_id} 
            role="button" 
            tabIndex={0} 
            onClick={() => onSelect(execution.execution_id)} 
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(execution.execution_id) } }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-800 truncate mr-2">{execution.participant_id ?? 'Anonymous Participant'}</span>
              <span className="flex items-center gap-1.5 shrink-0">
                <StatusBadge status={execution.status} />
                <button type="button" aria-label="Delete log" title="Delete log" onClick={(event) => { event.stopPropagation(); onRequestDelete(execution.execution_id) }} className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
            <small className="block text-slate-500 font-mono text-[10px]">{execution.execution_id}</small>
          </div>
        ))}
      </div>

      {selectedExecution && (
        <div className="execution-detail pt-3 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700">Timeline Events</span>
            <span className="text-[10px] text-slate-500">Node: {selectedExecution.current_node_id ?? 'Completed'}</span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {timeline.map((event) => (
              <details 
                className={`p-2 rounded-lg border text-xs bg-slate-50 ${
                  event.event_type === 'execution_failed' ? 'border-red-300 text-red-700 bg-red-50' : 'border-slate-200 text-slate-700'
                }`} 
                key={event.event_id}
              >
                <summary className="cursor-pointer font-medium hover:text-purple-700 flex items-center justify-between">
                  <span>{event.event_type}</span>
                  {event.node_id && <span className="text-[10px] text-slate-500 font-mono">{event.node_id}</span>}
                </summary>
                <pre className="mt-2 p-2 rounded bg-slate-900 text-[10px] font-mono text-slate-100 overflow-x-auto">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
