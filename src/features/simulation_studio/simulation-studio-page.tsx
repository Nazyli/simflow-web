import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { type EdgePathType } from '../../components/button-edge'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip'
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useViewport,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react'
import { Slider } from '../../components/ui/slider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  Upload,
  ChevronDown,
  Lock,
  Maximize,
  Minus,
  PanelLeftClose,
  Play,
  Plus,
  Save,
  ChevronRight,
  Sliders,
  History,
  Layers,
  X,
  AlertTriangle,
  Trash2,
  MapPin,
} from 'lucide-react'
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import dagre from 'dagre'
import { ApiError } from '../../shared/api/client'
import { deleteExecution, getExecutionTrace, getExecutions } from '../../shared/api/executions'
import { getNodeCatalog } from '../../shared/api/node-catalog'
import {
  addNode,
  addSimulationEdge,
  duplicateSimulation,
  exportSimulation,
  importSimulation,
  deleteNode,
  deleteSimulationEdge,
  deleteSimulation,
  getGraph,
  getSimulationDetail,
  getSimulations,
  updateNode,
  updateSimulationEdge,
  validateSimulation,
  type ApiEdge,
  type ApiNode,
  type ApiNodePayload,
  type SimulationGraph,
  type WorkflowPackage,
} from '../../shared/api/simulations'
import { replaceVisualGroups } from '../../shared/api/visual-groups'
import { LoadingState } from '../../shared/components/async-state'
import { StatusBadge } from '../../shared/components/status-badge'
import type {
  Execution,
  NodeDefinition,
  OutputPort,
  VisualGroup,
} from '../../shared/types/simulation'
import { EdgeConfigurationForm, NodeConfigurationForm } from './node-configuration-form'
import { SimulationGraphEdge } from './simulation-graph-edge'
import { SimulationGraphNode } from './simulation-graph-node'
import { SimulationVisualGroupNode } from './visual-groups/simulation-visual-group-node'
import { useVisualGroups } from './visual-groups/use-visual-groups'
import {
  absoluteToParentPosition,
  parentToAbsolutePosition,
  shouldDetachChild,
  type Rect,
} from './visual-groups/visual-group-layout'
import { projectWorkflowEdges } from './visual-groups/visual-group-projection'
import { NodeAutosaveQueue, type NodeAutosaveStatus } from './node-autosave'
import { WorkflowPackageDialog } from './workflow-package-dialog'

const emptyNodes: ApiNode[] = []
const emptyEdges: ApiEdge[] = []
const emptyVisualGroups: VisualGroup[] = []

const STUDIO_MIN_ZOOM = 0.1
const STUDIO_MAX_ZOOM = 4
const STUDIO_ZOOM_SLIDER_MIN = 10 // 0.1 * 100
const STUDIO_ZOOM_SLIDER_MAX = 400 // 4 * 100

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

const simulationNodeRenderers = {
  simulation: SimulationGraphNode,
  visualGroup: SimulationVisualGroupNode,
}
const simulationEdgeRenderers = { simulation: SimulationGraphEdge }

function combinedAutosaveStatus(statuses: Iterable<NodeAutosaveStatus>): NodeAutosaveStatus {
  const current = new Set(statuses)
  if (current.has('error')) return 'error'
  if (current.has('saving')) return 'saving'
  if (current.has('pending')) return 'pending'
  return 'saved'
}

function deriveNodeSummary(parameters: Record<string, unknown>): string | null {
  if (!parameters || typeof parameters !== 'object') return null
  for (const [, value] of Object.entries(parameters)) {
    if (value == null) continue
    if (typeof value === 'string') {
      const t = value.trim()
      if (t) return t.length > 48 ? `${t.slice(0, 48)}…` : t
    }
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    if (Array.isArray(value) && value.length > 0) {
      const parts = value
        .map((item) => {
          if (typeof item === 'string') return item.trim()
          if (typeof item === 'number' && Number.isFinite(item)) return String(item)
          if (item && typeof item === 'object') {
            const record = item as Record<string, unknown>
            for (const key of ['label', 'name', 'id']) {
              const field = record[key]
              if (typeof field === 'string' && field.trim()) return field.trim()
            }
          }
          return ''
        })
        .filter(Boolean)
      if (parts.length > 0) {
        const joined = parts.join(', ')
        return joined.length > 48 ? `${joined.slice(0, 48)}…` : joined
      }
      return `${value.length} item${value.length > 1 ? 's' : ''}`
    }
  }
  return null
}

function nodeToFlow(
  node: ApiNode,
  definition: NodeDefinition | undefined,
  editable: boolean,
  onRotate: (nodeId: string) => void,
  onRemoveFromGroup?: (nodeId: string) => void,
): Node {
  return {
    id: node.nodeId,
    type: 'simulation',
    position: { x: node.positionX ?? 80, y: node.positionY ?? 80 },
    data: {
      label: node.nodeName,
      nodeType: node.nodeType,
      color: definition?.color ?? '#64748b',
      inputPorts: node.inputPorts,
      outputPorts: node.outputPorts,
      rotation: node.rotation ?? 0,
      summary: deriveNodeSummary(node.parameters),
      category: node.category ?? definition?.category ?? null,
      editable,
      onRotate,
      onRemoveFromGroup,
    },
  }
}
function edgeToFlow(
  edge: ApiEdge,
  sourcePort: OutputPort | undefined,
  onDelete: (edgeId: string) => void,
  edgeType: EdgePathType = 'default',
  sourceNode?: ApiNode,
  visualProjection?: {
    hidden?: boolean
    sourceRect?: Rect
    targetRect?: Rect
    sourceNodeId?: string
    targetNodeId?: string
    sourceHandleId?: string
    targetHandleId?: string
  },
): Edge {
  const style = sourcePort?.edgeStyle ?? { color: '#94a3b8', lineStyle: 'solid', animated: false }
  let label = sourcePort?.label ?? edge.sourcePortId

  // Append timeout duration for timeout ports on wait nodes
  if (edge.sourcePortId === 'timeout' && sourceNode?.parameters?.timeoutSeconds) {
    const seconds = sourceNode.parameters.timeoutSeconds
    label = `${label} - ${seconds}s`
  }

  return {
    id: edge.edgeId,
    type: 'simulation',
    hidden: visualProjection?.hidden ?? false,
    source: visualProjection?.sourceNodeId ?? edge.sourceNodeId,
    sourceHandle: visualProjection?.sourceHandleId ?? edge.sourcePortId,
    target: visualProjection?.targetNodeId ?? edge.targetNodeId,
    targetHandle: visualProjection?.targetHandleId ?? edge.targetPortId,
    markerEnd: { type: MarkerType.ArrowClosed, color: style.color },
    animated: style.animated,
    data: {
      label,
      style,
      edgeType,
      onDelete,
      collapsedSourceRect: visualProjection?.sourceRect,
      collapsedTargetRect: visualProjection?.targetRect,
    },
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
  const { simulationId: urlSimulationId } = useParams<{ simulationId: string }>()

  // State management
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)
  const [deleteExecutionTarget, setDeleteExecutionTarget] = useState<string | null>(null)
  const [deleteSimulationTarget, setdeleteSimulationTarget] = useState<string | null>(null)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null)
  const [duplicateName, setDuplicateName] = useState('')
  const [duplicateDesc, setDuplicateDesc] = useState('')
  const [workflowActionsOpen, setWorkflowActionsOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [workflowPackage, setWorkflowPackage] = useState<WorkflowPackage | null>(null)
  const [workflowPackageFileName, setWorkflowPackageFileName] = useState<string | null>(null)
  const importFileInputRef = useRef<HTMLInputElement | null>(null)
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [edgePathType, setEdgePathType] = useState<EdgePathType>('smoothstep')
  const [validationRequested, setValidationRequested] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validating, setValidating] = useState(false)

  // UI Sidebars & Tabs
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [activeRightTab, setActiveRightTab] = useState<'inspector' | 'versions' | 'executions'>(
    'inspector',
  )

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [nodeAutosaveStatus, setNodeAutosaveStatus] = useState<NodeAutosaveStatus>('saved')

  // Cache node positions locally so React Query refetches don't reset user-arranged layout
  const localPositions = useRef<Map<string, { x: number; y: number }>>(new Map())
  const localRotations = useRef<Map<string, number>>(new Map())
  const nodeAutosaveStatuses = useRef<Map<string, NodeAutosaveStatus>>(new Map())
  const nodeAutosaveQueue = useRef<NodeAutosaveQueue<ApiNodePayload> | null>(null)
  const simulationIdRef = useRef<string | null>(null)
  const nodesRef = useRef<Node[]>([])
  const pendingEdgeKeys = useRef<Set<string>>(new Set())
  const fittedSimulationId = useRef<string | null>(null)

  // Stable ref for autosave — kept in sync after mutations are declared below.
  // Using ref avoids adding it as useEffect dependency (which would cause infinite loops).
  const persistNodeRef = useRef<
    (args: {
      id: string
      payload: Omit<ApiNode, 'nodeId' | 'category' | 'inputPorts' | 'outputPorts'>
    }) => void
  >(() => {})

  const updateNodeAutosaveStatus = useCallback((nodeId: string, status: NodeAutosaveStatus) => {
    nodeAutosaveStatuses.current.set(nodeId, status)
    setNodeAutosaveStatus(combinedAutosaveStatus(nodeAutosaveStatuses.current.values()))
  }, [])

  simulationIdRef.current = simulationId

  if (!nodeAutosaveQueue.current) {
    nodeAutosaveQueue.current = new NodeAutosaveQueue({
      delayMs: 400,
      save: updateNode,
      onStatusChange: updateNodeAutosaveStatus,
      onSuccess: (nodeId, result) => {
        const updated = result as ApiNode
        if (!updated) return
        // Prefer current simulationId, fallback to any cached graph containing the node
        // to handle race where simulationId changed between enqueue and success.
        const targetId = simulationIdRef.current
        let applied = false
        if (targetId) {
          queryClient.setQueryData<SimulationGraph>(['graph', targetId], (current) => {
            if (!current || !current.nodes.some((node) => node.nodeId === nodeId)) return current
            applied = true
            return {
              ...current,
              nodes: current.nodes.map((node) =>
                node.nodeId === nodeId
                  ? {
                      ...node,
                      ...updated,
                      inputPorts: updated.inputPorts,
                      outputPorts: updated.outputPorts,
                      category: updated.category,
                    }
                  : node,
              ),
            }
          })
          if (applied) return
        }
        queryClient.setQueriesData<SimulationGraph>({ queryKey: ['graph'] }, (current) => {
          if (!current || !current.nodes.some((node) => node.nodeId === nodeId)) return current
          return {
            ...current,
            nodes: current.nodes.map((node) =>
              node.nodeId === nodeId
                ? {
                    ...node,
                    ...updated,
                    inputPorts: updated.inputPorts,
                    outputPorts: updated.outputPorts,
                    category: updated.category,
                  }
                : node,
            ),
          }
        })
      },
    })
  }

  const enqueueNodeSave = useCallback(
    ({ id, payload }: { id: string; payload: ApiNodePayload }) => {
      if (!simulationId) return
      // Optimistic update: merge payload but preserve existing ports/category
      // so handles stay visible until server returns resolved ports.
      queryClient.setQueryData<SimulationGraph>(['graph', simulationId], (current) => {
        if (!current) return current
        return {
          ...current,
          nodes: current.nodes.map((node) =>
            node.nodeId === id
              ? {
                  ...node,
                  ...payload,
                  inputPorts: node.inputPorts,
                  outputPorts: node.outputPorts,
                  category: node.category,
                }
              : node,
          ),
        }
      })
      nodeAutosaveQueue.current?.enqueue(id, payload)
    },
    [queryClient, simulationId],
  )

  const retryFailedNodeSaves = useCallback(() => {
    nodeAutosaveStatuses.current.forEach((status, nodeId) => {
      if (status === 'error') nodeAutosaveQueue.current?.retry(nodeId)
    })
  }, [])

  // API Queries & Mutations
  const versionDetail = useQuery({
    queryKey: ['version-detail', urlSimulationId],
    queryFn: () => getSimulationDetail(urlSimulationId!),
    enabled: Boolean(urlSimulationId),
    retry: false,
  })
  const selectedGroupSimulation = useMemo(
    () =>
      versionDetail.data
        ? {
            groupSimulationId: versionDetail.data.groupSimulationId,
            groupSimulationName: versionDetail.data.groupSimulationName,
          }
        : null,
    [versionDetail.data],
  )
  const isLocked = Boolean(versionDetail.data?.isLocked)
  const executionCount = versionDetail.data?.executionCount ?? 0
  const lockedMessage =
    'Simulation has been used and cannot be edited. Duplicate it to make changes.'
  const graph = useQuery({
    queryKey: ['graph', simulationId],
    queryFn: () => getGraph(simulationId!),
    enabled: Boolean(simulationId) && versionDetail.isSuccess,
  })
  const nodeCatalog = useQuery({ queryKey: ['node-catalog'], queryFn: getNodeCatalog })
  const versions = useQuery({
    queryKey: ['simulation-versions', selectedGroupSimulation?.groupSimulationId],
    queryFn: () => getSimulations(selectedGroupSimulation!.groupSimulationId),
    enabled: Boolean(selectedGroupSimulation),
  })
  const executions = useQuery({
    queryKey: ['executions', simulationId],
    queryFn: () => getExecutions(simulationId!),
    enabled: Boolean(simulationId) && versionDetail.isSuccess,
  })
  const executionTimeline = useQuery({
    queryKey: ['execution-node-executions', selectedExecutionId],
    queryFn: () => getExecutionTrace(selectedExecutionId!),
    enabled: Boolean(selectedExecutionId),
  })

  const createDraft = useMutation({
    mutationFn: async (payload: {
      sourceId: string
      simulationName: string
      simulationDesc: string | null
    }) =>
      duplicateSimulation(payload.sourceId, {
        simulationName: payload.simulationName,
        simulationDesc: payload.simulationDesc,
      }),
    onSuccess: (version) => {
      queryClient.invalidateQueries({
        queryKey: ['simulation-versions', selectedGroupSimulation?.groupSimulationId],
      })
      queryClient.invalidateQueries({ queryKey: ['master', 'chats'] })
      queryClient.invalidateQueries({ queryKey: ['master', 'calls'] })
      queryClient.invalidateQueries({ queryKey: ['master', 'prompts'] })
      queryClient.invalidateQueries({ queryKey: ['master', 'emails'] })
      queryClient.invalidateQueries({ queryKey: ['master', 'email'] })
      navigate(`/studio/${version.simulationId}`)
      setDuplicateOpen(false)
      toast.success(`Duplicated to "${version.simulationName}".`)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const exportWorkflow = useMutation({
    mutationFn: () => exportSimulation(simulationId!),
    onSuccess: (workflowPackage) => {
      const blob = new Blob([JSON.stringify(workflowPackage, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const safeName = workflowPackage.simulation.name
        .replace(/[^a-z0-9-_]+/gi, '-')
        .replace(/^-|-$/g, '')
      link.href = url
      link.download = `${safeName || 'simflow-workflow'}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Workflow exported as JSON.')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const importWorkflow = useMutation({
    mutationFn: (packageToImport: WorkflowPackage) =>
      importSimulation(simulationId!, packageToImport),
    onSuccess: (version) => {
      queryClient.invalidateQueries({
        queryKey: ['simulation-versions', selectedGroupSimulation?.groupSimulationId],
      })
      queryClient.invalidateQueries({ queryKey: ['simulations'] })
      queryClient.invalidateQueries({ queryKey: ['master', 'chats'] })
      queryClient.invalidateQueries({ queryKey: ['master', 'calls'] })
      queryClient.invalidateQueries({ queryKey: ['master', 'prompts'] })
      queryClient.invalidateQueries({ queryKey: ['master', 'emails'] })
      queryClient.invalidateQueries({ queryKey: ['master', 'email'] })
      setImportDialogOpen(false)
      setWorkflowPackage(null)
      setWorkflowPackageFileName(null)
      navigate(`/studio/${version.simulationId}`)
      toast.success(`Imported as "${version.simulationName}".`)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const addGraphNode = useMutation({
    mutationFn: ({
      definition,
      position,
    }: {
      definition: NodeDefinition
      position?: { x: number; y: number }
    }) =>
      addNode(simulationId!, {
        nodeName: `${definition.label} node`,
        nodeType: definition.nodeType,
        parameters: { ...definition.parameters },
        rotation: 0,
        positionX: Math.round(position?.x ?? 180),
        positionY: Math.round(position?.y ?? 180),
      }),
    onSuccess: (node) => {
      setSelectedNodeId(node.nodeId)
      setActiveRightTab('inspector')
      setRightSidebarOpen(true)
      queryClient.invalidateQueries({ queryKey: ['graph', simulationId] })
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })
  const duplicateGraphNode = useMutation({
    mutationFn: (node: ApiNode) =>
      addNode(simulationId!, {
        nodeName: `${node.nodeName} copy`,
        nodeType: node.nodeType,
        parameters: { ...node.parameters },
        duplicateFromNodeId: node.nodeId,
        rotation: node.rotation ?? 0,
        positionX: (node.positionX ?? 80) + 60,
        positionY: (node.positionY ?? 80) + 60,
      }),
    onSuccess: (node) => {
      setSelectedNodeId(node.nodeId)
      setActiveRightTab('inspector')
      setRightSidebarOpen(true)
      queryClient.invalidateQueries({ queryKey: ['graph', simulationId] })
      queryClient.invalidateQueries({ queryKey: ['master', 'chats'] })
      queryClient.invalidateQueries({ queryKey: ['master', 'calls'] })
      queryClient.invalidateQueries({ queryKey: ['master', 'prompts'] })
      queryClient.invalidateQueries({ queryKey: ['master', 'emails'] })
      queryClient.invalidateQueries({ queryKey: ['master', 'email'] })
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })
  const removeNode = useMutation({
    mutationFn: deleteNode,
    onSuccess: () => {
      setSelectedNodeId(null)
      queryClient.invalidateQueries({ queryKey: ['graph', simulationId] })
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })
  const persistEdge = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<ApiEdge, 'edgeId' | 'isValid'> }) =>
      updateSimulationEdge(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['graph', simulationId] }),
    onError: (error) => toast.error(apiErrorMessage(error)),
  })
  const removeEdge = useMutation({
    mutationFn: deleteSimulationEdge,
    onSuccess: () => {
      setSelectedEdgeId(null)
      queryClient.invalidateQueries({ queryKey: ['graph', simulationId] })
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })
  const removeExecution = useMutation({
    mutationFn: deleteExecution,
    onSuccess: (_result, executionId) => {
      if (selectedExecutionId === executionId) setSelectedExecutionId(null)
      queryClient.invalidateQueries({ queryKey: ['executions', simulationId] })
      toast.success('Execution log deleted.')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })
  const removeSimulation = useMutation({
    mutationFn: deleteSimulation,
    onSuccess: (_result, deletedVersionId) => {
      if (simulationId === deletedVersionId) {
        navigate('/studio')
      }
      queryClient.invalidateQueries({
        queryKey: ['simulation-versions', selectedGroupSimulation?.groupSimulationId],
      })
      queryClient.invalidateQueries({ queryKey: ['simulations'] })
      toast.success('Simulation deleted.')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })
  const removeEdgeRef = useRef(removeEdge)
  removeEdgeRef.current = removeEdge
  const deleteEdge = useCallback(
    (edgeId: string) => {
      if (isLocked) {
        toast.error(lockedMessage)
        return
      }
      removeEdgeRef.current.mutate(edgeId)
    },
    [isLocked, lockedMessage],
  )

  const handleDuplicateNode = useCallback(
    (node: ApiNode) => {
      if (isLocked) {
        toast.error(lockedMessage)
        return
      }
      duplicateGraphNode.mutate(node)
    },
    [isLocked, lockedMessage, duplicateGraphNode],
  )
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (isLocked) {
        toast.error(lockedMessage)
        return
      }
      removeNode.mutate(nodeId)
    },
    [isLocked, lockedMessage, removeNode],
  )
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      if (isLocked) {
        toast.error(lockedMessage)
        return
      }
      removeEdge.mutate(edgeId)
    },
    [isLocked, lockedMessage, removeEdge],
  )

  const apiNodes = graph.data?.nodes ?? emptyNodes
  const apiEdges = graph.data?.edges ?? emptyEdges
  const apiVisualGroups = graph.data?.visualGroups ?? emptyVisualGroups
  const saveVisualGroups = useCallback(
    async (groups: typeof apiVisualGroups) => {
      if (!simulationId) return
      const saved = await replaceVisualGroups(simulationId, groups)
      queryClient.setQueryData<SimulationGraph>(['graph', simulationId], (current) =>
        current ? { ...current, visualGroups: saved } : current,
      )
    },
    [queryClient, simulationId],
  )
  const visualGroupEditor = useVisualGroups({
    simulationId,
    initialGroups: apiVisualGroups,
    editable: Boolean(simulationId) && !isLocked,
    save: saveVisualGroups,
  })
  const groupList = visualGroupEditor.groups
  const createVisualGroupFromNodes = visualGroupEditor.createGroup
  const attachVisualGroupMember = visualGroupEditor.attachMember
  const detachVisualGroupMember = visualGroupEditor.detachMember
  const updateVisualGroup = visualGroupEditor.updateGroup
  const visualGroupNodes = visualGroupEditor.groupNodes
  const projectVisualNodes = visualGroupEditor.projectNodes
  const detachWorkflowNode = useCallback(
    (nodeId: string) => {
      const flowNode = nodesRef.current.find((node) => node.id === nodeId)
      const group = flowNode?.parentId
        ? groupList.find((item) => item.visualGroupId === flowNode.parentId)
        : undefined
      if (!flowNode || !group) return
      const groupRect: Rect = {
        x: group.positionX,
        y: group.positionY,
        width: group.width,
        height: group.height,
      }
      const absolutePosition = parentToAbsolutePosition(flowNode.position, groupRect)
      void detachVisualGroupMember(group.visualGroupId, nodeId)
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? { ...node, parentId: undefined, hidden: false, position: absolutePosition }
            : node,
        ),
      )
      localPositions.current.set(nodeId, {
        x: Math.round(absolutePosition.x),
        y: Math.round(absolutePosition.y),
      })
      const current = apiNodes.find((node) => node.nodeId === nodeId)
      if (current) {
        enqueueNodeSave({
          id: nodeId,
          payload: {
            ...current,
            positionX: Math.round(absolutePosition.x),
            positionY: Math.round(absolutePosition.y),
          },
        })
      }
    },
    [apiNodes, detachVisualGroupMember, enqueueNodeSave, groupList, setNodes],
  )
  const addWorkflowNodeToGroup = useCallback(
    (nodeId: string, groupId: string) => {
      const flowNode = nodesRef.current.find((node) => node.id === nodeId)
      const group = groupList.find((item) => item.visualGroupId === groupId)
      if (!flowNode || !group || flowNode.parentId) return
      const groupRect: Rect = {
        x: group.positionX,
        y: group.positionY,
        width: group.width,
        height: group.height,
      }
      void attachVisualGroupMember(groupId, nodeId)
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                parentId: groupId,
                position: absoluteToParentPosition(node.position, groupRect),
                hidden: false,
                zIndex: 1,
                data: { ...node.data, parentGroupId: groupId },
              }
            : node,
        ),
      )
    },
    [attachVisualGroupMember, groupList, setNodes],
  )
  const definitions = useMemo(
    () =>
      new Map(
        (nodeCatalog.data?.nodes ?? []).map((definition) => [definition.nodeType, definition]),
      ),
    [nodeCatalog.data],
  )
  const selectedNode = useMemo(
    () => apiNodes.find((node) => node.nodeId === selectedNodeId) ?? null,
    [apiNodes, selectedNodeId],
  )
  const selectedEdge = useMemo(
    () => apiEdges.find((edge) => edge.edgeId === selectedEdgeId) ?? null,
    [apiEdges, selectedEdgeId],
  )
  const selectedSimulation = versions.data?.find((version) => version.simulationId === simulationId)
  const selectedExecution =
    executions.data?.find((execution) => execution.executionId === selectedExecutionId) ?? null
  const selectedWorkflowNodeIds = useMemo(
    () =>
      nodes.filter((node) => node.type === 'simulation' && node.selected).map((node) => node.id),
    [nodes],
  )

  const createGroupFromSelection = useCallback(() => {
    if (!simulationId || isLocked) {
      if (isLocked) toast.error(lockedMessage)
      return
    }
    if (selectedWorkflowNodeIds.length < 2) {
      toast.error('Select at least two workflow nodes to create a visual group.')
      return
    }
    const groupById = new Map(groupList.map((group) => [group.visualGroupId, group]))
    const selectedNodes = nodes
      .filter((node) => selectedWorkflowNodeIds.includes(node.id))
      .map((node) => {
        const group = node.parentId ? groupById.get(node.parentId) : undefined
        return group
          ? {
              ...node,
              position: parentToAbsolutePosition(node.position, {
                x: group.positionX,
                y: group.positionY,
                width: group.width,
                height: group.height,
              }),
            }
          : node
      })
    void createVisualGroupFromNodes(selectedNodes, selectedWorkflowNodeIds, { simulationId })
  }, [
    isLocked,
    lockedMessage,
    nodes,
    selectedWorkflowNodeIds,
    simulationId,
    createVisualGroupFromNodes,
    groupList,
  ])

  const openDuplicateDialog = useCallback(
    (sourceOverride?: {
      simulationId: string
      simulationName: string
      simulationDesc: string | null
    }) => {
      const source = sourceOverride ?? selectedSimulation ?? versions.data?.[0]
      if (!source) {
        toast.error('No version available to duplicate.')
        return
      }
      setDuplicateSourceId(source.simulationId)
      setDuplicateName(`${source.simulationName} (Copy)`)
      setDuplicateDesc(source.simulationDesc ?? '')
      setDuplicateOpen(true)
    },
    [selectedSimulation, versions.data],
  )

  const openImportPicker = useCallback(() => {
    setWorkflowActionsOpen(false)
    importFileInputRef.current?.click()
  }, [])

  const handleImportFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as WorkflowPackage
      if (parsed.format !== 'simflow.workflow' || parsed.format_version !== 1) {
        throw new Error('Unsupported workflow package format or version.')
      }
      if (
        !parsed.simulation ||
        !Array.isArray(parsed.nodes) ||
        !Array.isArray(parsed.edges) ||
        !Array.isArray(parsed.visual_groups) ||
        typeof parsed.master_data !== 'object' ||
        parsed.master_data === null
      ) {
        throw new Error('Workflow package is incomplete.')
      }
      setWorkflowPackage(parsed)
      setWorkflowPackageFileName(file.name)
      setImportDialogOpen(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to read workflow JSON.')
    }
  }, [])

  const invalidNodeIds = useMemo(() => new Set<string>(), [])
  const invalidEdgeIds = useMemo(() => new Set<string>(), [])

  const rotateNode = useCallback(
    (nodeId: string) => {
      if (isLocked) {
        toast.error(lockedMessage)
        return
      }
      const current = apiNodes.find((item) => item.nodeId === nodeId)
      if (!current) return
      const currentRotation = localRotations.current.get(nodeId) ?? current.rotation ?? 0
      const next = (currentRotation + 90) % 360
      localRotations.current.set(nodeId, next)
      setNodes((flowNodes) =>
        flowNodes.map((flowNode) =>
          flowNode.id === nodeId
            ? { ...flowNode, data: { ...flowNode.data, rotation: next } }
            : flowNode,
        ),
      )
      persistNodeRef.current?.({
        id: nodeId,
        payload: {
          ...current,
          rotation: next,
        },
      })
    },
    [apiNodes, isLocked, lockedMessage, setNodes],
  )

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      if (isLocked) {
        const hasMutation = changes.some(
          (c) => c.type === 'position' || c.type === 'remove' || c.type === 'add',
        )
        if (hasMutation) {
          // silently block drag/position mutations to avoid toast spam during drag
          const onlySelect = changes.filter((c) => c.type === 'select')
          if (onlySelect.length) onNodesChange(onlySelect as Parameters<typeof onNodesChange>[0])
          return
        }
        const filtered = changes.filter((c) => c.type === 'select' || c.type === 'dimensions')
        if (filtered.length) onNodesChange(filtered as Parameters<typeof onNodesChange>[0])
        return
      }
      onNodesChange(changes)
    },
    [isLocked, onNodesChange],
  )

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      if (isLocked) {
        const onlySelect = changes.filter((c) => c.type === 'select')
        if (onlySelect.length) {
          onEdgesChange(onlySelect as Parameters<typeof onEdgesChange>[0])
        }
        // block all other edge mutations silently; connect/delete will show toast via their handlers
        return
      }
      onEdgesChange(changes)
    },
    [isLocked, onEdgesChange],
  )

  // Keep stable refs in sync with latest values
  persistNodeRef.current = enqueueNodeSave

  // The URL version param drives the builder; resetting selections keeps the
  // previous version's graph and inspector from leaking across version switches.
  useEffect(() => {
    setSimulationId(urlSimulationId ?? null)
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setSelectedExecutionId(null)
  }, [urlSimulationId])

  // Automatically focus Inspector tab when node or edge is selected
  useEffect(() => {
    if (selectedNodeId || selectedEdgeId) {
      setActiveRightTab('inspector')
      setRightSidebarOpen(true)
    }
  }, [selectedNodeId, selectedEdgeId])

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  // Sync React Flow nodes when graph data loads or changes.
  // Positions are cached in localPositions ref; only new nodes get auto-layout.
  useEffect(() => {
    if (apiNodes.length === 0) {
      setNodes(visualGroupNodes)
      setEdges(
        apiEdges.map((edge) => {
          const sourceNode = apiNodes.find((node) => node.nodeId === edge.sourceNodeId)
          return edgeToFlow(
            edge,
            sourceNode?.outputPorts.find((port) => port.id === edge.sourcePortId),
            deleteEdge,
            edgePathType,
            sourceNode,
          )
        }),
      )
      return
    }

    // Detect nodes that genuinely lack a position in the API response
    const nodesNeedingLayout: string[] = []
    apiNodes.forEach((node) => {
      if (node.positionX === null || node.positionY === null) {
        nodesNeedingLayout.push(node.nodeId)
      } else {
        // Update cache with latest API position (API is source of truth for saved positions)
        localPositions.current.set(node.nodeId, { x: node.positionX, y: node.positionY })
      }
    })

    // Build a dagre layout and use it only for nodes that truly have no position
    if (nodesNeedingLayout.length > 0) {
      const dagreGraph = new dagre.graphlib.Graph()
      dagreGraph.setGraph({ rankdir: 'LR', nodesep: 130, ranksep: 200, marginx: 60, marginy: 60 })
      dagreGraph.setDefaultEdgeLabel(() => ({}))
      const nodeIds = new Set(apiNodes.map((n) => n.nodeId))
      apiNodes.forEach((node) => dagreGraph.setNode(node.nodeId, { width: 200, height: 90 }))
      apiEdges.forEach((edge) => {
        if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) return
        dagreGraph.setEdge(edge.sourceNodeId, edge.targetNodeId)
      })
      dagre.layout(dagreGraph)

      // Assign dagre positions and cache them
      nodesNeedingLayout.forEach((nodeId) => {
        const meta = dagreGraph.node(nodeId)
        if (!meta) return
        const pos = { x: meta.x - meta.width / 2, y: meta.y - meta.height / 2 }
        localPositions.current.set(nodeId, pos)
      })

      // Persist auto-layout positions for all versions — every version is now editable.
      // Deferred with setTimeout to avoid calling mutate during the render phase.
      if (!isLocked) {
        const nodesToSave = apiNodes.filter((n) => nodesNeedingLayout.includes(n.nodeId))
        setTimeout(() => {
          nodesToSave.forEach((node) => {
            const pos = localPositions.current.get(node.nodeId)
            if (!pos || !persistNodeRef.current) return
            persistNodeRef.current({
              id: node.nodeId,
              payload: {
                nodeName: node.nodeName,
                nodeType: node.nodeType,
                parameters: node.parameters,
                rotation: node.rotation ?? 0,
                positionX: pos.x,
                positionY: pos.y,
              },
            })
          })
        }, 0)
      }
    }

    // Build React Flow nodes using cached positions
    const workflowNodes = apiNodes.map((node) => {
      const cached = localPositions.current.get(node.nodeId)
      const rotation = localRotations.current.get(node.nodeId) ?? node.rotation
      return {
        ...nodeToFlow(
          { ...node, rotation },
          definitions.get(node.nodeType),
          !isLocked,
          rotateNode,
          detachWorkflowNode,
        ),
        position: cached ?? { x: node.positionX ?? 100, y: node.positionY ?? 100 },
      }
    })
    const projectedWorkflowNodes = projectVisualNodes(workflowNodes).map((node) => ({
      ...node,
      data: {
        ...node.data,
        parentGroupId: node.parentId,
        availableGroups: groupList
          .filter((group) => !group.memberNodeIds.includes(node.id))
          .map((group) => ({
            visualGroupId: group.visualGroupId,
            groupName: group.groupName,
          })),
        onAddToGroup: addWorkflowNodeToGroup,
      },
    }))
    const visualGroupById = new Map(groupList.map((group) => [group.visualGroupId, group]))
    const projectedWorkflowEdges = projectWorkflowEdges(apiEdges, groupList)
    setNodes([...visualGroupNodes, ...projectedWorkflowNodes])
    setEdges(
      projectedWorkflowEdges.map((edge) => {
        const sourceNode = apiNodes.find((node) => node.nodeId === edge.sourceNodeId)
        const sourceGroup = edge.sourceGroupId ? visualGroupById.get(edge.sourceGroupId) : undefined
        const targetGroup = edge.targetGroupId ? visualGroupById.get(edge.targetGroupId) : undefined
        return edgeToFlow(
          edge,
          sourceNode?.outputPorts.find((port) => port.id === edge.sourcePortId),
          deleteEdge,
          edgePathType,
          sourceNode,
          {
            hidden: edge.hidden,
            sourceRect: sourceGroup
              ? {
                  x: sourceGroup.positionX,
                  y: sourceGroup.positionY,
                  width: sourceGroup.width,
                  height: sourceGroup.isCollapsed ? 32 : sourceGroup.height,
                }
              : undefined,
            targetRect: targetGroup
              ? {
                  x: targetGroup.positionX,
                  y: targetGroup.positionY,
                  width: targetGroup.width,
                  height: targetGroup.isCollapsed ? 32 : targetGroup.height,
                }
              : undefined,
            sourceNodeId: edge.visualSourceNodeId,
            targetNodeId: edge.visualTargetNodeId,
            sourceHandleId: edge.visualSourceHandleId,
            targetHandleId: edge.visualTargetHandleId,
          },
        )
      }),
    )
  }, [
    apiNodes,
    apiEdges,
    definitions,
    isLocked,
    setNodes,
    setEdges,
    deleteEdge,
    rotateNode,
    detachWorkflowNode,
    addWorkflowNodeToGroup,
    groupList,
    visualGroupNodes,
    projectVisualNodes,
    edgePathType,
  ])

  useEffect(() => {
    setSelectedExecutionId(null)
    localPositions.current.clear()
    localRotations.current.clear()
    fittedSimulationId.current = null
  }, [simulationId])

  // Center on Start node once per simulationId at zoom 1, after final dagre/localPositions resolve.
  // Uses setCenter with zoom 1 so slider stays 100%; waits for nodes+flowInstance ready; fallback first node.
  // Keeps defaultViewport zoom 1 and auto-fitView disabled; manual Fit View via toolbar/Controls tetap tersedia.
  useEffect(() => {
    if (!flowInstance || !simulationId || apiNodes.length === 0 || nodes.length === 0) return
    if (fittedSimulationId.current === simulationId) return
    const startNode =
      apiNodes.find((n) => n.nodeType === 'start') ??
      apiNodes.find((n) => (n.category as string) === 'trigger') ??
      apiNodes[0]
    if (!startNode) return
    const flowNode = nodes.find((n) => n.id === startNode.nodeId) as
      (Node & { measured?: { width?: number; height?: number } }) | undefined
    const cached = localPositions.current.get(startNode.nodeId)
    const pos = flowNode?.position ??
      cached ?? { x: startNode.positionX ?? 0, y: startNode.positionY ?? 0 }
    const measuredW = flowNode?.measured?.width ?? 200
    const measuredH = flowNode?.measured?.height ?? 90
    const halfW = measuredW > 0 ? measuredW / 2 : 75
    const halfH = measuredH > 0 ? measuredH / 2 : 40
    const cx = pos.x + halfW
    const cy = pos.y + halfH
    fittedSimulationId.current = simulationId
    const frame = requestAnimationFrame(() =>
      flowInstance.setCenter(cx, cy, { zoom: 1, duration: 240 }),
    )
    return () => cancelAnimationFrame(frame)
  }, [apiNodes, nodes, flowInstance, simulationId])

  // Apply edgePathType to all edges when dropdown changes
  useEffect(() => {
    setEdges((current) =>
      current.map((edge) => ({
        ...edge,
        data: { ...edge.data, edgeType: edgePathType },
      })),
    )
  }, [edgePathType, setEdges])

  useEffect(() => {
    const miniMap = document.querySelector<HTMLElement>('.graph .react-flow__minimap')
    if (miniMap) miniMap.style.display = showMiniMap ? '' : 'none'
  }, [showMiniMap])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (isLocked) {
          toast.error(lockedMessage)
          return
        }
        if (selectedNodeId) {
          event.preventDefault()
          removeNode.mutate(selectedNodeId)
          return
        }
        if (selectedEdgeId) {
          event.preventDefault()
          removeEdge.mutate(selectedEdgeId)
        }
      }
      if (event.key === ' ' && target?.closest('.graph')) {
        document.documentElement.classList.add('canvas-pan-active')
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ') document.documentElement.classList.remove('canvas-pan-active')
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [isLocked, lockedMessage, removeEdge, removeNode, selectedEdgeId, selectedNodeId])

  useEffect(() => {
    function acceptPaletteDrop(event: globalThis.DragEvent) {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest('.graph') ||
        !flowInstance ||
        !simulationId
      )
        return
      if (isLocked) {
        toast.error(lockedMessage)
        return
      }
      const nodeType = event.dataTransfer?.getData('application/simulation-builder-node-type')
      const definition = definitions.get(nodeType ?? '')
      if (!definition) return
      event.preventDefault()
      event.stopPropagation()
      addGraphNode.mutate({
        definition,
        position: flowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      })
    }
    function allowPaletteDrop(event: globalThis.DragEvent) {
      if (isLocked) return
      if (
        event.target instanceof Element &&
        event.target.closest('.graph') &&
        event.dataTransfer?.types.includes('application/simulation-builder-node-type')
      )
        event.preventDefault()
    }
    document.addEventListener('dragover', allowPaletteDrop, true)
    document.addEventListener('drop', acceptPaletteDrop, true)
    return () => {
      document.removeEventListener('dragover', allowPaletteDrop, true)
      document.removeEventListener('drop', acceptPaletteDrop, true)
    }
  }, [addGraphNode, definitions, flowInstance, isLocked, lockedMessage, simulationId])

  function connect(connection: Connection) {
    if (isLocked) {
      toast.error(lockedMessage)
      return
    }
    if (
      !simulationId ||
      !connection.source ||
      !connection.target ||
      !connection.sourceHandle ||
      !connection.targetHandle
    )
      return
    const connectionKey = [
      connection.source,
      connection.sourceHandle,
      connection.target,
      connection.targetHandle,
    ].join(':')
    if (pendingEdgeKeys.current.has(connectionKey)) return
    if (connection.source === connection.target) {
      toast.error('A node cannot connect to itself.')
      return
    }
    if (
      apiEdges.some(
        (edge) =>
          edge.sourceNodeId === connection.source &&
          edge.sourcePortId === connection.sourceHandle &&
          edge.targetNodeId === connection.target &&
          edge.targetPortId === connection.targetHandle,
      )
    ) {
      toast.error('That port connection already exists.')
      return
    }
    const sourceNode = apiNodes.find((node) => node.nodeId === connection.source)
    const targetNode = apiNodes.find((node) => node.nodeId === connection.target)
    const sourcePort = sourceNode?.outputPorts.find((port) => port.id === connection.sourceHandle)
    const targetPort = targetNode?.inputPorts.find((port) => port.id === connection.targetHandle)
    if (!sourcePort || !targetPort) {
      toast.error('Select a catalog-defined output port and input port.')
      return
    }
    if (
      sourcePort.dataType !== 'any' &&
      !targetPort.acceptedDataTypes.includes('any') &&
      !targetPort.acceptedDataTypes.includes(sourcePort.dataType)
    ) {
      toast.error('The selected ports have incompatible data types.')
      return
    }
    if (
      apiEdges.filter(
        (edge) =>
          edge.sourceNodeId === connection.source && edge.sourcePortId === connection.sourceHandle,
      ).length >= sourcePort.maxConnections
    ) {
      toast.error('The source output port has reached its connection limit.')
      return
    }
    if (
      apiEdges.filter(
        (edge) =>
          edge.targetNodeId === connection.target && edge.targetPortId === connection.targetHandle,
      ).length >= targetPort.maxConnections
    ) {
      toast.error('The target input port has reached its connection limit.')
      return
    }
    if (targetNode?.nodeType !== 'conversation_group' && targetNode?.nodeType !== 'loop') {
      const adjacency = new Map<string, string[]>()
      apiEdges.forEach((edge) =>
        adjacency.set(edge.sourceNodeId, [
          ...(adjacency.get(edge.sourceNodeId) ?? []),
          edge.targetNodeId,
        ]),
      )
      const pending = [connection.target]
      const visited = new Set<string>()
      while (pending.length) {
        const nodeId = pending.pop()!
        if (nodeId === connection.source) {
          toast.error('That connection would create a cycle.')
          return
        }
        if (!visited.has(nodeId)) {
          visited.add(nodeId)
          pending.push(...(adjacency.get(nodeId) ?? []))
        }
      }
    }
    const pendingEdgeId = `pending:${connectionKey}`
    const pendingEdge: ApiEdge = {
      edgeId: pendingEdgeId,
      sourceNodeId: connection.source,
      sourcePortId: connection.sourceHandle,
      targetNodeId: connection.target,
      targetPortId: connection.targetHandle,
      isValid: true,
    }
    pendingEdgeKeys.current.add(connectionKey)
    const flowSourceNode = nodes.find((n) => n.id === connection.source)?.data as
      { apiNode?: ApiNode } | undefined
    setEdges((current) => [
      ...current,
      edgeToFlow(pendingEdge, sourcePort, deleteEdge, edgePathType, flowSourceNode?.apiNode),
    ])
    addSimulationEdge(simulationId, {
      sourceNodeId: connection.source,
      sourcePortId: connection.sourceHandle,
      targetNodeId: connection.target,
      targetPortId: connection.targetHandle,
    })
      .then((edge) => {
        queryClient.setQueryData<SimulationGraph>(['graph', simulationId], (current) =>
          current
            ? {
                ...current,
                edges: [...current.edges.filter((item) => item.edgeId !== edge.edgeId), edge],
              }
            : current,
        )
        setEdges((current) =>
          current.map((item) => {
            if (item.id === pendingEdgeId) {
              const sourceNode = apiNodes.find((n) => n.nodeId === edge.sourceNodeId)
              return edgeToFlow(edge, sourcePort, deleteEdge, edgePathType, sourceNode)
            }
            return item
          }),
        )
      })
      .catch((error: unknown) => {
        setEdges((current) => current.filter((item) => item.id !== pendingEdgeId))
        toast.error(apiErrorMessage(error))
      })
      .finally(() => {
        pendingEdgeKeys.current.delete(connectionKey)
        queryClient.invalidateQueries({ queryKey: ['graph', simulationId] })
      })
  }

  function applyAutoLayout() {
    if (isLocked) {
      toast.error(lockedMessage)
      return
    }
    if (!simulationId || apiNodes.length === 0) return
    const layout = new dagre.graphlib.Graph()
    layout.setGraph({ rankdir: 'LR', nodesep: 130, ranksep: 200, marginx: 60, marginy: 60 })
    layout.setDefaultEdgeLabel(() => ({}))
    apiNodes.forEach((node) => layout.setNode(node.nodeId, { width: 200, height: 90 }))
    apiEdges.forEach((edge) => layout.setEdge(edge.sourceNodeId, edge.targetNodeId))
    dagre.layout(layout)
    const positions = new Map<string, { x: number; y: number }>()
    apiNodes.forEach((node) => {
      const meta = layout.node(node.nodeId)
      if (meta)
        positions.set(node.nodeId, { x: meta.x - meta.width / 2, y: meta.y - meta.height / 2 })
    })
    positions.forEach((position, nodeId) => localPositions.current.set(nodeId, position))
    setNodes((current) =>
      current.map((node) => ({ ...node, position: positions.get(node.id) ?? node.position })),
    )
    apiNodes.forEach((node) => {
      const position = positions.get(node.nodeId)
      if (position)
        enqueueNodeSave({
          id: node.nodeId,
          payload: {
            nodeName: node.nodeName,
            nodeType: node.nodeType,
            parameters: node.parameters,
            rotation: node.rotation ?? 0,
            positionX: position.x,
            positionY: position.y,
          },
        })
    })
    requestAnimationFrame(() => flowInstance?.fitView({ padding: 0.2, duration: 240 }))
  }

  function startPaletteDrag(event: DragEvent<HTMLDivElement>, nodeType: string) {
    if (isLocked) {
      event.preventDefault()
      toast.error(lockedMessage)
      return
    }
    event.dataTransfer.setData('application/simulation-builder-node-type', nodeType)
    event.dataTransfer.setData('text/plain', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  function allowCanvasDrop(event: DragEvent<HTMLDivElement>) {
    if (isLocked) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function dropPaletteNode(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (isLocked) {
      toast.error(lockedMessage)
      return
    }
    const definition = definitions.get(
      event.dataTransfer.getData('application/simulation-builder-node-type'),
    )
    if (!definition || !flowInstance || !simulationId) return
    addGraphNode.mutate({
      definition,
      position: flowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY }),
    })
  }

  function saveStructuredNode(name: string, parameters: Record<string, unknown>) {
    if (isLocked) {
      toast.error(lockedMessage)
      return
    }
    if (!selectedNode) return
    enqueueNodeSave({
      id: selectedNode.nodeId,
      payload: {
        nodeName: name,
        nodeType: selectedNode.nodeType,
        parameters,
        rotation: selectedNode.rotation ?? 0,
        positionX: selectedNode.positionX,
        positionY: selectedNode.positionY,
      },
    })
  }

  function saveStructuredEdge() {
    if (isLocked) {
      toast.error(lockedMessage)
      return
    }
    if (!selectedEdge) return
    persistEdge.mutate({
      id: selectedEdge.edgeId,
      payload: {
        sourceNodeId: selectedEdge.sourceNodeId,
        sourcePortId: selectedEdge.sourcePortId,
        targetNodeId: selectedEdge.targetNodeId,
        targetPortId: selectedEdge.targetPortId,
      },
    })
  }

  async function validateGraph() {
    if (!simulationId) {
      toast.error('No simulation selected.')
      return
    }
    try {
      setValidating(true)
      const res = await validateSimulation(simulationId)
      setValidationErrors(res.errors)
      setValidationRequested(true)
      if (res.valid) toast.success('Graph is valid')
    } catch (e) {
      toast.error(apiErrorMessage(e))
    } finally {
      setValidating(false)
    }
  }

  if (versionDetail.isPending) {
    return (
      <div className="grid h-[calc(100vh-64px)] place-items-center bg-slate-50 p-6">
        <LoadingState variant="canvas" />
      </div>
    )
  }

  if (versionDetail.isError) {
    return (
      <div className="grid h-[calc(100vh-64px)] place-items-center bg-slate-50 p-6">
        <div className="max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
          <h2 className="text-sm font-bold text-slate-900">Simulation not found</h2>
          <p className="mt-1 text-xs leading-normal text-slate-500">
            This version may have been deleted. Go back to the simulation list and open another
            version.
          </p>
          <Button type="button" className="mt-4" onClick={() => navigate('/studio')}>
            Back to simulations
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="studio-app-container flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-slate-50 text-slate-800">
      {/* Studio Header Bar */}
      <header className="studio-top-header z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setLeftSidebarOpen((prev) => !prev)}
            title={leftSidebarOpen ? 'Collapse left sidebar' : 'Expand left sidebar'}
          >
            <PanelLeftClose size={16} />
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-bold tracking-wider text-purple-700 uppercase">
              Studio
            </span>
            <nav className="flex min-w-0 items-center gap-1.5" aria-label="Studio breadcrumb">
              <Link
                to="/studio"
                className="shrink-0 text-sm font-semibold text-slate-500 transition-colors hover:text-purple-700"
              >
                GroupSimulations
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              <h1 className="truncate text-base font-bold text-slate-900">
                {selectedGroupSimulation?.groupSimulationName ?? 'Loading…'}
              </h1>
            </nav>
          </div>

          <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex">
            {selectedSimulation ? (
              <span className="inline-flex h-5 items-center rounded-4xl border border-slate-200 bg-slate-50 px-2 text-[0.66rem] font-semibold text-slate-600">
                {selectedSimulation.simulationName}
              </span>
            ) : (
              <span className="inline-flex h-5 w-fit items-center rounded-4xl border border-slate-200 bg-slate-50 px-2 text-[0.66rem] font-semibold text-slate-500">
                No Simulation
              </span>
            )}
            {isLocked && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700"
                    title={`Used ${executionCount} time${executionCount === 1 ? '' : 's'}`}
                  >
                    <Lock className="h-3 w-3" /> Locked • Used {executionCount} times
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Simulation has been used and cannot be edited. Duplicate it to make changes.
                </TooltipContent>
              </Tooltip>
            )}
            {nodeAutosaveStatus === 'error' ? (
              <button
                type="button"
                onClick={retryFailedNodeSaves}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700"
              >
                <AlertTriangle size={13} /> Save failed — retry
              </button>
            ) : (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Save
                  size={13}
                  className={nodeAutosaveStatus === 'saved' ? 'text-emerald-600' : 'text-amber-500'}
                />
                {nodeAutosaveStatus === 'saved'
                  ? 'Autosaved'
                  : nodeAutosaveStatus === 'saving'
                    ? 'Saving…'
                    : 'Changes pending…'}
              </span>
            )}
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {selectedGroupSimulation && (
            <div className="mr-2 hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 p-1 md:flex">
              <select
                className="cursor-pointer bg-transparent px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none"
                value={simulationId ?? ''}
                onChange={(event) => {
                  if (event.target.value) navigate(`/studio/${event.target.value}`)
                }}
              >
                <option value="" className="bg-white">
                  Select version...
                </option>
                {versions.data?.map((v) => (
                  <option key={v.simulationId} value={v.simulationId} className="bg-white">
                    {v.simulationName}
                  </option>
                ))}
              </select>
              <Popover open={workflowActionsOpen} onOpenChange={setWorkflowActionsOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    <Copy className="h-3 w-3" /> Workflow actions{' '}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700"
                    onClick={() => {
                      setWorkflowActionsOpen(false)
                      openDuplicateDialog()
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-50"
                    disabled={exportWorkflow.isPending || !selectedSimulation}
                    onClick={() => {
                      setWorkflowActionsOpen(false)
                      exportWorkflow.mutate()
                    }}
                  >
                    <Download className="h-3.5 w-3.5" /> Export JSON
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-50"
                    disabled={!selectedSimulation || importWorkflow.isPending}
                    onClick={openImportPicker}
                  >
                    <Upload className="h-3.5 w-3.5" /> Import JSON
                  </button>
                </PopoverContent>
              </Popover>
              <input
                ref={importFileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          )}

          {isLocked && (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-amber-700"
              onClick={() => openDuplicateDialog()}
              title="Duplicate this locked simulation to make changes"
            >
              <Copy size={14} /> Duplicate to Edit
            </button>
          )}
          <button
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 disabled:opacity-50"
            type="button"
            disabled={!selectedSimulation || validating}
            onClick={validateGraph}
            title="Validate graph"
          >
            <CheckCircle2 size={14} /> {validating ? 'Validating…' : 'Validate'}
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-100"
            onClick={() => navigate('/simulation')}
          >
            <Play size={14} className="fill-purple-600 text-purple-600" /> Run Simulation
          </button>

          <button
            type="button"
            className="ml-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setRightSidebarOpen((prev) => !prev)}
            title={rightSidebarOpen ? 'Collapse inspector sidebar' : 'Expand inspector sidebar'}
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </header>

      {/* Main Studio Workspace Grid */}
      <div className="studio-main-workspace relative flex flex-1 overflow-hidden">
        {/* Left Sidebar: Node Palette */}
        <aside
          className={`studio-left-sidebar z-10 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 ${leftSidebarOpen ? 'w-72 min-w-[280px]' : 'w-0 min-w-0 overflow-hidden opacity-0'}`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 p-3">
            <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
              <Layers className="h-4 w-4 text-purple-600" /> Node Palette
            </h2>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              Drag & Drop
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 content-start gap-1.5">
              <p className="col-span-2 mb-1 text-xs text-slate-500">
                Drag a component card onto the canvas or click to append.
              </p>

              {(nodeCatalog.data?.categories ?? []).map((cat) => {
                const catNodes = (nodeCatalog.data?.nodes ?? []).filter(
                  (n) => n.category === cat.id,
                )
                if (catNodes.length === 0) return null
                return (
                  <Fragment key={cat.id}>
                    {catNodes.map((definition) => {
                      const isEditable = Boolean(simulationId) && !isLocked

                      return (
                        <Tooltip key={definition.nodeType}>
                          <TooltipTrigger asChild>
                            <div
                              draggable={isEditable}
                              onDragStart={(event) => startPaletteDrag(event, definition.nodeType)}
                              onClick={() => {
                                if (isLocked) {
                                  toast.error(lockedMessage)
                                  return
                                }
                                if (isEditable) addGraphNode.mutate({ definition })
                              }}
                              style={{
                                borderColor: `${definition.color}55`,
                                backgroundColor: `${definition.color}0d`,
                              }}
                              className={`palette-card-item cursor-grab rounded-lg border px-2 py-1.5 text-center transition-all active:cursor-grabbing ${
                                isEditable
                                  ? 'border-slate-200 opacity-100 hover:scale-[1.02] hover:shadow-md'
                                  : 'cursor-not-allowed opacity-50'
                              }`}
                            >
                              <strong className="w-full text-xs leading-tight font-semibold text-slate-800">
                                {definition.label}
                              </strong>
                            </div>
                          </TooltipTrigger>
                          {definition.description && (
                            <TooltipContent side="right" className="max-w-60">
                              {definition.description}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      )
                    })}
                  </Fragment>
                )
              })}

              {isLocked && (
                <div className="col-span-2 mt-3 flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <span className="flex items-center gap-2 font-semibold">
                    <Lock className="h-4 w-4 text-amber-600" /> Locked — read-only
                  </span>
                  <span className="leading-normal">
                    This simulation has been used {executionCount} time
                    {executionCount === 1 ? '' : 's'} and cannot be edited.
                  </span>
                  <button
                    type="button"
                    className="mt-1 inline-flex items-center justify-center gap-1 rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                    onClick={() => openDuplicateDialog()}
                  >
                    <Copy className="h-3 w-3" /> Duplicate to Edit
                  </button>
                </div>
              )}
              {!selectedSimulation && !isLocked && (
                <div className="col-span-2 mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  Select or create a version to start editing nodes.
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center Canvas Area */}
        <section className="studio-canvas-area relative flex flex-1 flex-col bg-slate-100/70">
          {/* Floating Canvas Glassmorphism Toolbar */}
          <div className="floating-canvas-toolbar absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 p-1.5 shadow-md backdrop-blur-md">
            <div className="flex items-center gap-1 border-r border-slate-200 px-1">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Zoom Out"
                onClick={() => flowInstance?.zoomOut()}
                title="Zoom Out"
              >
                <Minus size={15} />
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Zoom In"
                onClick={() => flowInstance?.zoomIn()}
                title="Zoom In"
              >
                <Plus size={15} />
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Fit View"
                onClick={() => flowInstance?.fitView()}
                title="Fit Canvas View"
              >
                <Maximize size={15} />
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Auto layout"
                onClick={applyAutoLayout}
                disabled={!simulationId || !apiNodes.length}
                title="Arrange nodes automatically"
              >
                <Layers size={15} />
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1 rounded-lg p-1.5 px-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={createGroupFromSelection}
                disabled={isLocked || selectedWorkflowNodeIds.length < 2}
                title="Group selected workflow nodes"
              >
                <Layers size={15} /> Group
              </button>
            </div>

            <div className="flex items-center gap-1 pl-1">
              <select
                value={edgePathType}
                onChange={(e) => setEdgePathType(e.target.value as EdgePathType)}
                className="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-1.5 text-xs text-slate-600 transition-colors outline-none hover:bg-slate-50"
                title="Edge path style"
              >
                <option value="default">Bezier</option>
                <option value="straight">Straight</option>
                <option value="step">Step</option>
                <option value="smoothstep">Smooth</option>
              </select>

              <button
                type="button"
                className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${showMiniMap ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => setShowMiniMap((curr) => !curr)}
                title="Toggle Minimap"
              >
                <MapPin size={15} />
              </button>

              <button
                type="button"
                className={`inline-flex items-center justify-center gap-1 rounded-lg p-1.5 px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${validationRequested ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={validateGraph}
                disabled={validating || !simulationId}
                title="Validate Graph Structure"
              >
                <ClipboardCheck size={15} /> {validating ? 'Validating…' : 'Validate'}
              </button>
            </div>
          </div>

          {/* Graph Validation Floating Drawer */}
          {validationRequested && (
            <div
              className={`animate-slide-up absolute right-4 bottom-4 left-4 z-20 rounded-xl border p-4 shadow-xl backdrop-blur-md md:right-auto md:max-w-md ${validationErrors.length > 0 ? 'border-red-200 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3
                  className={`flex items-center gap-2 text-sm font-bold ${validationErrors.length > 0 ? 'text-red-700' : 'text-emerald-700'}`}
                >
                  {validationErrors.length > 0 ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-600" /> Graph Validation Errors
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Graph is valid
                    </>
                  )}
                </h3>
                <button
                  className={
                    validationErrors.length > 0
                      ? 'text-red-500 hover:text-red-800'
                      : 'text-emerald-500 hover:text-emerald-800'
                  }
                  onClick={() => setValidationRequested(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {validationErrors.length > 0 ? (
                <ul className="max-h-36 list-disc space-y-1 overflow-y-auto pl-4 text-xs text-red-700">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-700">
                  No validation errors found. The graph is ready to run.
                </p>
              )}
            </div>
          )}

          {/* React Flow Canvas Container */}
          <div
            className="graph h-full w-full flex-1 border-none bg-slate-50"
            onDragOver={allowCanvasDrop}
            onDrop={dropPaletteNode}
          >
            <ReactFlow
              nodeTypes={simulationNodeRenderers}
              edgeTypes={simulationEdgeRenderers}
              onInit={setFlowInstance}
              nodesDraggable={!isLocked}
              nodesConnectable={!isLocked}
              elementsSelectable={true}
              minZoom={STUDIO_MIN_ZOOM}
              maxZoom={STUDIO_MAX_ZOOM}
              nodes={nodes.map((node) => ({
                ...node,
                className: invalidNodeIds.has(node.id) ? 'invalid-node' : '',
                draggable: !isLocked,
                connectable: !isLocked,
              }))}
              edges={edges.map((edge) => ({
                ...edge,
                className:
                  invalidEdgeIds.has(edge.id) ||
                  apiEdges.find((apiEdge) => apiEdge.edgeId === edge.id)?.isValid === false
                    ? 'invalid-edge'
                    : '',
                selectable: true,
                deletable: !isLocked,
              }))}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={connect}
              onNodeClick={(_, node) => {
                if (node.type === 'visualGroup') {
                  setSelectedNodeId(null)
                  setSelectedEdgeId(null)
                  return
                }
                setSelectedNodeId(node.id)
                setSelectedEdgeId(null)
              }}
              onEdgeClick={(_, edge) => {
                setSelectedEdgeId(edge.id)
                setSelectedNodeId(null)
              }}
              onNodeDragStop={(_, node) => {
                if (isLocked) {
                  toast.error(lockedMessage)
                  return
                }

                if (node.type === 'visualGroup') {
                  const group = groupList.find((item) => item.visualGroupId === node.id)
                  if (!group) return
                  const nextGroupRect: Rect = {
                    x: Math.round(node.position.x),
                    y: Math.round(node.position.y),
                    width: group.width,
                    height: group.height,
                  }
                  void updateVisualGroup(node.id, {
                    positionX: nextGroupRect.x,
                    positionY: nextGroupRect.y,
                  })

                  nodesRef.current
                    .filter((child) => child.parentId === node.id)
                    .forEach((child) => {
                      const absolute = parentToAbsolutePosition(child.position, nextGroupRect)
                      localPositions.current.set(child.id, {
                        x: Math.round(absolute.x),
                        y: Math.round(absolute.y),
                      })
                      const current = apiNodes.find((item) => item.nodeId === child.id)
                      if (!current) return
                      enqueueNodeSave({
                        id: child.id,
                        payload: {
                          ...current,
                          positionX: Math.round(absolute.x),
                          positionY: Math.round(absolute.y),
                        },
                      })
                    })
                  return
                }

                const parentGroup = node.parentId
                  ? groupList.find((group) => group.visualGroupId === node.parentId)
                  : undefined
                const absolutePosition = parentGroup
                  ? parentToAbsolutePosition(node.position, {
                      x: parentGroup.positionX,
                      y: parentGroup.positionY,
                      width: parentGroup.width,
                      height: parentGroup.height,
                    })
                  : node.position
                const nodeWidth =
                  (node as Node & { measured?: { width?: number } }).measured?.width ??
                  node.width ??
                  220
                const nodeHeight =
                  (node as Node & { measured?: { height?: number } }).measured?.height ??
                  node.height ??
                  90
                if (
                  parentGroup &&
                  shouldDetachChild(
                    {
                      x: absolutePosition.x,
                      y: absolutePosition.y,
                      width: nodeWidth,
                      height: nodeHeight,
                    },
                    {
                      x: parentGroup.positionX,
                      y: parentGroup.positionY,
                      width: parentGroup.width,
                      height: parentGroup.height,
                    },
                  )
                ) {
                  void detachVisualGroupMember(parentGroup.visualGroupId, node.id)
                  setNodes((current) =>
                    current.map((item) =>
                      item.id === node.id
                        ? {
                            ...item,
                            parentId: undefined,
                            hidden: false,
                            position: absolutePosition,
                          }
                        : item,
                    ),
                  )
                }
                // Immediately update local cache so refetch doesn't undo the drag
                localPositions.current.set(node.id, {
                  x: Math.round(absolutePosition.x),
                  y: Math.round(absolutePosition.y),
                })
                const current = apiNodes.find((item) => item.nodeId === node.id)
                if (current)
                  enqueueNodeSave({
                    id: node.id,
                    payload: {
                      ...current,
                      positionX: Math.round(absolutePosition.x),
                      positionY: Math.round(absolutePosition.y),
                    },
                  })
              }}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              fitView={false}
            >
              <Background color="#cbd5e1" gap={20} size={1} />
              <Controls className="border-slate-200 bg-white fill-current text-slate-700 shadow-md" />
              <ZoomSliderPanel />
              <MiniMap
                className="border-slate-200 bg-white shadow-md"
                maskColor="rgba(241, 245, 249, 0.7)"
              />
            </ReactFlow>
          </div>
        </section>

        {/* Right Sidebar: Tabbed Inspector, Versions, Executions */}
        <aside
          className={`studio-right-sidebar z-10 flex flex-col border-l border-slate-200 bg-white transition-all duration-200 ${rightSidebarOpen ? 'w-80 min-w-[320px]' : 'w-0 min-w-0 overflow-hidden opacity-0'}`}
        >
          {/* Tab Navigation */}
          <div className="right-sidebar-tabs flex gap-1 border-b border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              className={`tab-btn flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                activeRightTab === 'inspector'
                  ? 'border border-slate-200 bg-white text-purple-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveRightTab('inspector')}
            >
              <Sliders className="h-3.5 w-3.5" /> Inspector
            </button>

            <button
              type="button"
              className={`tab-btn flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                activeRightTab === 'versions'
                  ? 'border border-slate-200 bg-white text-purple-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveRightTab('versions')}
            >
              <History className="h-3.5 w-3.5" /> Versions
            </button>

            <button
              type="button"
              className={`tab-btn flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                activeRightTab === 'executions'
                  ? 'border border-slate-200 bg-white text-purple-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveRightTab('executions')}
            >
              <Play className="h-3.5 w-3.5" /> Log
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Inspector Tab */}
            {activeRightTab === 'inspector' && (
              <div className="space-y-4">
                {selectedNode && (
                  <NodeConfigurationForm
                    key={selectedNode.nodeId}
                    node={{ ...selectedNode, configuration: selectedNode.parameters }}
                    definition={definitions.get(selectedNode.nodeType)}
                    graphNodes={apiNodes}
                    simulationId={simulationId}
                    onSave={saveStructuredNode}
                    onDuplicate={() => handleDuplicateNode(selectedNode)}
                    onDelete={() => handleDeleteNode(selectedNode.nodeId)}
                    readonly={isLocked}
                  />
                )}

                {selectedEdge && (
                  <EdgeConfigurationForm
                    onSave={saveStructuredEdge}
                    onDelete={() => handleDeleteEdge(selectedEdge.edgeId)}
                    readonly={isLocked}
                  />
                )}

                {!selectedNode && !selectedEdge && (
                  <div className="empty-inspector px-4 py-10 text-center text-slate-400">
                    <Sliders className="mx-auto mb-3 h-10 w-10 stroke-[1.5] text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">Nothing Selected</p>
                    <p className="mt-1 text-xs leading-normal text-slate-500">
                      Click any node or connection line on the canvas to configure parameters and
                      conditions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Versions Tab */}
            {activeRightTab === 'versions' && (
              <div className="space-y-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    GroupSimulation Versions
                  </h3>
                  {selectedGroupSimulation && (
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded bg-purple-600 px-2.5 py-1 text-xs font-medium text-white shadow-xs hover:bg-purple-700"
                      onClick={() => openDuplicateDialog()}
                    >
                      <Plus className="h-3 w-3" /> Duplicate
                    </button>
                  )}
                </div>

                {selectedGroupSimulation &&
                  (versions.isPending ? (
                    <LoadingState />
                  ) : (
                    <div className="space-y-2">
                      {versions.data?.map((version) => (
                        <div
                          key={version.simulationId}
                          className={`cursor-pointer rounded-xl border p-3 transition-all ${
                            version.simulationId === simulationId
                              ? 'border-purple-300 bg-purple-50 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          onClick={() => navigate(`/studio/${version.simulationId}`)}
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                              {version.simulationName}
                              {version.isLocked && (
                                <span
                                  className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"
                                  title={`Used ${version.executionCount ?? 0} times`}
                                >
                                  <Lock className="h-3 w-3" /> Locked
                                </span>
                              )}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <button
                                type="button"
                                aria-label="Duplicate version"
                                title="Duplicate version"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  openDuplicateDialog(version)
                                }}
                                className="rounded-md p-1 text-slate-400 transition hover:bg-purple-50 hover:text-purple-600"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                aria-label="Delete version"
                                title="Delete version"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setdeleteSimulationTarget(version.simulationId)
                                }}
                                className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {version.isLocked
                              ? `Locked • Used ${version.executionCount ?? 0} times`
                              : `Created: ${new Date().toLocaleDateString()}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
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

      {/* Delete Execution Log Confirmation */}
      <Dialog
        open={Boolean(deleteExecutionTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteExecutionTarget(null)
        }}
      >
        <DialogContent className="p-6 sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Trash2 className="h-5 w-5 text-red-600" /> Delete execution log?
          </DialogTitle>
          <DialogDescription>
            This permanently deletes the execution, its timeline events, node results, waits,
            timers, and the simulation session when no other execution uses it. This cannot be
            undone.
          </DialogDescription>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteExecutionTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={removeExecution.isPending}
              onClick={() => {
                if (deleteExecutionTarget) removeExecution.mutate(deleteExecutionTarget)
                setDeleteExecutionTarget(null)
              }}
              className="border-0 bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />{' '}
              {removeExecution.isPending ? 'Deleting…' : 'Delete log'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete GroupSimulation Version Confirmation */}
      <Dialog
        open={Boolean(deleteSimulationTarget)}
        onOpenChange={(open) => {
          if (!open) setdeleteSimulationTarget(null)
        }}
      >
        <DialogContent className="p-6 sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Trash2 className="h-5 w-5 text-red-600" /> Delete simulation version?
          </DialogTitle>
          <DialogDescription>
            This permanently deletes the version, its nodes, and its edges. This cannot be undone.
            Versions that already have execution logs cannot be deleted.
          </DialogDescription>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setdeleteSimulationTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={removeSimulation.isPending}
              onClick={() => {
                if (deleteSimulationTarget) removeSimulation.mutate(deleteSimulationTarget)
                setdeleteSimulationTarget(null)
              }}
              className="border-0 bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />{' '}
              {removeSimulation.isPending ? 'Deleting…' : 'Delete version'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WorkflowPackageDialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open)
          if (!open) {
            setWorkflowPackage(null)
            setWorkflowPackageFileName(null)
          }
        }}
        packageFileName={workflowPackageFileName}
        workflowPackage={workflowPackage}
        importing={importWorkflow.isPending}
        onImport={() => {
          if (workflowPackage) importWorkflow.mutate(workflowPackage)
        }}
      />

      {/* Duplicate Simulation Dialog */}
      <Dialog
        open={duplicateOpen}
        onOpenChange={(open) => {
          if (!open) setDuplicateOpen(false)
        }}
      >
        <DialogContent className="p-6 sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Copy className="h-5 w-5 text-purple-600" /> Duplicate simulation
          </DialogTitle>
          <DialogDescription>
            Create a copy of this version. You can rename it and update the description before
            duplicating.
          </DialogDescription>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              const trimmed = duplicateName.trim()
              if (!trimmed) {
                toast.error('Simulation name is required.')
                return
              }
              if (!duplicateSourceId) {
                toast.error('No source simulation selected.')
                return
              }
              createDraft.mutate({
                sourceId: duplicateSourceId,
                simulationName: trimmed,
                simulationDesc: duplicateDesc.trim() ? duplicateDesc.trim() : null,
              })
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-1.5">
              <Label htmlFor="duplicate-name" className="text-slate-700">
                Simulation name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={(event) => setDuplicateName(event.target.value)}
                placeholder="e.g. Main Flow (Copy)"
                required
                maxLength={128}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="duplicate-desc" className="text-slate-700">
                Description <span className="text-xs text-slate-400">(optional)</span>
              </Label>
              <Textarea
                id="duplicate-desc"
                value={duplicateDesc}
                onChange={(event) => setDuplicateDesc(event.target.value)}
                placeholder="Describe the purpose of this simulation..."
                rows={3}
                maxLength={1024}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDuplicateOpen(false)}
                disabled={createDraft.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createDraft.isPending || !duplicateName.trim()}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                <Copy className="h-3.5 w-3.5" />
                {createDraft.isPending ? 'Duplicating…' : 'Duplicate'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ExecutionHistoryPanel({
  executions,
  selectedExecution,
  timeline,
  isLoading,
  onSelect,
  onRequestDelete,
}: {
  executions: Execution[]
  selectedExecution: Execution | null
  timeline: {
    eventId: string
    eventType: string
    nodeId: string | null
    payload: Record<string, unknown>
  }[]
  isLoading: boolean
  onSelect: (executionId: string) => void
  onRequestDelete: (executionId: string) => void
}) {
  return (
    <div className="execution-history-panel space-y-4">
      <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
        <History className="h-4 w-4 text-purple-600" /> Execution Logs
      </h3>

      {isLoading && <LoadingState />}
      {executions.length === 0 && !isLoading && (
        <p className="py-4 text-center text-xs text-slate-400">
          No execution logs for this version.
        </p>
      )}

      <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
        {executions.map((execution) => (
          <div
            className={`w-full cursor-pointer rounded-xl border p-2.5 text-left text-xs transition-all ${
              selectedExecution?.executionId === execution.executionId
                ? 'border-purple-300 bg-purple-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            key={execution.executionId}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(execution.executionId)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(execution.executionId)
              }
            }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="mr-2 truncate font-semibold text-slate-800">
                {typeof execution.context.participantId === 'string'
                  ? execution.context.participantId
                  : (execution.participantId ?? 'Participant unavailable')}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <StatusBadge status={execution.status} />
                <button
                  type="button"
                  aria-label="Delete log"
                  title="Delete log"
                  onClick={(event) => {
                    event.stopPropagation()
                    onRequestDelete(execution.executionId)
                  }}
                  className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
            <small className="block font-mono text-[10px] text-slate-500">
              {execution.executionId}
            </small>
          </div>
        ))}
      </div>

      {selectedExecution && (
        <div className="execution-detail space-y-2 border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700">Timeline Events</span>
            <span className="text-[10px] text-slate-500">
              Node: {selectedExecution.currentNodeId ?? 'Completed'}
            </span>
          </div>

          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {timeline.map((event) => (
              <details
                className={`rounded-lg border bg-slate-50 p-2 text-xs ${
                  event.eventType === 'execution_failed'
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-slate-200 text-slate-700'
                }`}
                key={event.eventId}
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium hover:text-purple-700">
                  <span>{event.eventType}</span>
                  {event.nodeId && (
                    <span className="font-mono text-[10px] text-slate-500">{event.nodeId}</span>
                  )}
                </summary>
                <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-2 font-mono text-[10px] text-slate-100">
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
