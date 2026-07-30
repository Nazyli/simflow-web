import '@xyflow/react/dist/style.css'
import * as Dialog from '@radix-ui/react-dialog'
import { Background, Controls, MarkerType, MiniMap, ReactFlow, useEdgesState, useNodesState, type Connection, type Edge, type Node, type ReactFlowInstance } from '@xyflow/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ClipboardCheck, Eye, Maximize, Minus, Play, Plus, Save, Undo2, Redo2 } from 'lucide-react'
import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../shared/api/client'
import { getExecutions, getTimeline } from '../../shared/api/executions'
import { addNode, addWorkflowEdge, createDraftFromVersion, createWorkflow, deleteNode, deleteWorkflow, deleteWorkflowEdge, getGraph, getWorkflowVersions, getWorkflows, publishVersion, updateNode, updateWorkflow, updateWorkflowEdge, type ApiEdge, type ApiNode } from '../../shared/api/workflows'
import { LoadingState } from '../../shared/components/async-state'
import { StatusBadge } from '../../shared/components/status-badge'
import type { Execution, Workflow } from '../../shared/types/workflow'
import { EdgeConfigurationForm, NodeConfigurationForm } from './node-configuration-form'
import { WorkflowGraphEdge } from './workflow-graph-edge'
import { WorkflowGraphNode } from './workflow-graph-node'

const nodeTypes = ['trigger', 'condition', 'action', 'event'] as const
const emptyNodes: ApiNode[] = []
const emptyEdges: ApiEdge[] = []

const workflowNodeRenderers = { workflow: WorkflowGraphNode }
const workflowEdgeRenderers = { workflow: WorkflowGraphEdge }

function nodeToFlow(node: ApiNode): Node { return { id: node.node_id, type: 'workflow', position: { x: node.position_x ?? 80, y: node.position_y ?? 80 }, data: { label: node.node_name, nodeType: node.node_type, triggerType: node.node_type === 'trigger' ? String(node.configuration.trigger_type ?? 'manual') : undefined } } }
function edgeToFlow(edge: ApiEdge): Edge { return { id: edge.edge_id, type: 'workflow', source: edge.source_node_id, target: edge.target_node_id, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }, data: { priority: edge.priority, condition: edge.condition_configuration } } }

function publishErrors(error: Error | null): string[] {
  if (!(error instanceof ApiError)) return []
  try {
    const detail = JSON.parse(error.message).detail
    return Array.isArray(detail?.errors) ? detail.errors.filter((item: unknown): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function SimulationStudioPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [versionId, setVersionId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [validationRequested, setValidationRequested] = useState(false)
  const [workflowPickerOpen, setWorkflowPickerOpen] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const workflows = useQuery({ queryKey: ['workflows'], queryFn: getWorkflows })
  const graph = useQuery({ queryKey: ['graph', versionId], queryFn: () => getGraph(versionId!), enabled: Boolean(versionId) })
  const versions = useQuery({ queryKey: ['workflow-versions', selectedWorkflow?.workflow_id], queryFn: () => getWorkflowVersions(selectedWorkflow!.workflow_id), enabled: Boolean(selectedWorkflow) })
  const executions = useQuery({ queryKey: ['executions', versionId], queryFn: () => getExecutions(versionId!), enabled: Boolean(versionId) })
  const executionTimeline = useQuery({ queryKey: ['execution-timeline', selectedExecutionId], queryFn: () => getTimeline(selectedExecutionId!), enabled: Boolean(selectedExecutionId) })
  const create = useMutation({ mutationFn: createWorkflow, onSuccess: (workflow) => { setSelectedWorkflow(workflow); queryClient.invalidateQueries({ queryKey: ['workflows'] }) } })
  const update = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Pick<Workflow, 'workflow_name' | 'workflow_desc' | 'workspace_id'> }) => updateWorkflow(id, payload), onSuccess: (workflow) => { setSelectedWorkflow(workflow); queryClient.invalidateQueries({ queryKey: ['workflows'] }) } })
  const removeWorkflow = useMutation({ mutationFn: deleteWorkflow, onSuccess: () => { setSelectedWorkflow(null); setVersionId(null); setSelectedNodeId(null); setSelectedEdgeId(null); setNodes([]); setEdges([]); queryClient.invalidateQueries({ queryKey: ['workflows'] }) } })
  const createDraft = useMutation({ mutationFn: async (_workflowId: string) => { const sourceVersion = selectedVersion ?? versions.data?.find((version) => version.status === 'published'); if (!sourceVersion) throw new Error('Select a published version before creating a draft.'); return createDraftFromVersion(sourceVersion.workflow_version_id) }, onSuccess: (version) => { setVersionId(version.workflow_version_id); setSelectedNodeId(null); setSelectedEdgeId(null); queryClient.invalidateQueries({ queryKey: ['workflow-versions', selectedWorkflow?.workflow_id] }) } })
  const publish = useMutation({ mutationFn: publishVersion, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); queryClient.invalidateQueries({ queryKey: ['workflow-versions', selectedWorkflow?.workflow_id] }) } })
  const addGraphNode = useMutation({ mutationFn: ({ nodeType, position }: { nodeType: typeof nodeTypes[number]; position?: { x: number; y: number } }) => addNode(versionId!, { node_name: `${nodeType} node`, node_type: nodeType, configuration: nodeType === 'action' ? { channel: 'chat', await_participant: false } : {}, position_x: Math.round(position?.x ?? 180), position_y: Math.round(position?.y ?? 180) }), onSuccess: (node) => { setSelectedNodeId(node.node_id); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) } })
  const duplicateGraphNode = useMutation({ mutationFn: (node: ApiNode) => addNode(versionId!, { node_name: `${node.node_name} copy`, node_type: node.node_type, configuration: { ...node.configuration }, position_x: (node.position_x ?? 80) + 60, position_y: (node.position_y ?? 80) + 60 }), onSuccess: (node) => { setSelectedNodeId(node.node_id); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) } })
  const persistNode = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<ApiNode, 'node_id'> }) => updateNode(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) })
  const removeNode = useMutation({ mutationFn: deleteNode, onSuccess: () => { setSelectedNodeId(null); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) } })
  const persistEdge = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<ApiEdge, 'edge_id'> }) => updateWorkflowEdge(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) })
  const removeEdge = useMutation({ mutationFn: deleteWorkflowEdge, onSuccess: () => { setSelectedEdgeId(null); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) } })
  const apiNodes = graph.data?.[0] ?? emptyNodes
  const apiEdges = graph.data?.[1] ?? emptyEdges
  const selectedNode = useMemo(() => apiNodes.find((node) => node.node_id === selectedNodeId) ?? null, [apiNodes, selectedNodeId])
  const selectedEdge = useMemo(() => apiEdges.find((edge) => edge.edge_id === selectedEdgeId) ?? null, [apiEdges, selectedEdgeId])
  const selectedVersion = versions.data?.find((version) => version.workflow_version_id === versionId)
  const selectedExecution = executions.data?.find((execution) => execution.execution_id === selectedExecutionId) ?? null
  const validationErrors = useMemo(() => publishErrors(publish.error), [publish.error])
  const invalidNodeIds = useMemo(() => new Set(validationErrors.flatMap((error) => [...error.matchAll(/Node '([^']+)'/g)].map((match) => match[1]))), [validationErrors])
  const invalidEdgeIds = useMemo(() => new Set(validationErrors.flatMap((error) => [...error.matchAll(/Edge '([^']+)'/g)].map((match) => match[1]))), [validationErrors])

  useEffect(() => {
    const positionCounts = new Map<string, number>()
    const distinctRows = new Set<number>()
    apiNodes.forEach((node) => {
      const key = `${node.position_x ?? 'missing'}:${node.position_y ?? 'missing'}`
      positionCounts.set(key, (positionCounts.get(key) ?? 0) + 1)
      if (node.position_y !== null) distinctRows.add(node.position_y)
    })
    const nodeIds = new Set(apiNodes.map((node) => node.node_id))
    const incoming = new Map(apiNodes.map((node) => [node.node_id, 0]))
    const outgoing = new Map(apiNodes.map((node) => [node.node_id, [] as string[]]))
    apiEdges.forEach((edge) => {
      if (!nodeIds.has(edge.source_node_id) || !nodeIds.has(edge.target_node_id)) return
      incoming.set(edge.target_node_id, (incoming.get(edge.target_node_id) ?? 0) + 1)
      outgoing.get(edge.source_node_id)?.push(edge.target_node_id)
    })
    const levels = new Map<string, number>()
    const pending = apiNodes.filter((node) => (incoming.get(node.node_id) ?? 0) === 0).map((node) => node.node_id)
    pending.forEach((nodeId) => levels.set(nodeId, 0))
    while (pending.length) {
      const nodeId = pending.shift()!
      const level = levels.get(nodeId) ?? 0
      outgoing.get(nodeId)?.forEach((targetId) => {
        levels.set(targetId, Math.max(levels.get(targetId) ?? 0, level + 1))
        incoming.set(targetId, (incoming.get(targetId) ?? 1) - 1)
        if (incoming.get(targetId) === 0) pending.push(targetId)
      })
    }
    const nodesByLevel = new Map<number, string[]>()
    apiNodes.forEach((node) => {
      const level = levels.get(node.node_id) ?? 0
      nodesByLevel.set(level, [...(nodesByLevel.get(level) ?? []), node.node_id])
    })
    setNodes(apiNodes.map((node, index) => {
      const flowNode = nodeToFlow(node)
      const key = `${node.position_x ?? 'missing'}:${node.position_y ?? 'missing'}`
      const needsFallbackPosition = node.position_x === null || node.position_y === null || (positionCounts.get(key) ?? 0) > 1 || distinctRows.size <= 1
      if (!needsFallbackPosition) return flowNode
      const level = levels.get(node.node_id) ?? index
      const row = nodesByLevel.get(level)?.indexOf(node.node_id) ?? 0
      return { ...flowNode, position: { x: 100 + level * 360, y: 100 + row * 280 } }
    }))
    setEdges(apiEdges.map(edgeToFlow))
  }, [apiNodes, apiEdges, setNodes, setEdges])
  useEffect(() => {
    if (!flowInstance || apiNodes.length === 0) return
    const frame = requestAnimationFrame(() => flowInstance.fitView({ padding: 0.2, duration: 240 }))
    return () => cancelAnimationFrame(frame)
  }, [apiEdges.length, apiNodes.length, flowInstance])
  useEffect(() => { setSelectedExecutionId(null) }, [versionId])
  useEffect(() => {
    const miniMap = document.querySelector<HTMLElement>('.graph .react-flow__minimap')
    if (miniMap) miniMap.style.display = showMiniMap ? '' : 'none'
  }, [showMiniMap])
  useEffect(() => {
    document.querySelectorAll<HTMLButtonElement>('.palette-hint ~ button[draggable]').forEach((button) => {
      const type = nodeTypes.find((item) => button.textContent?.toLowerCase().includes(item))
      if (type) button.dataset.nodeType = type
    })
  }, [selectedVersion?.status, versionId])
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
      const nodeType = event.dataTransfer?.getData('application/simflow-node-type') as typeof nodeTypes[number]
      if (!nodeTypes.includes(nodeType)) return
      event.preventDefault(); event.stopPropagation()
      addGraphNode.mutate({ nodeType, position: flowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY }) })
    }
    function allowPaletteDrop(event: globalThis.DragEvent) {
      if (event.target instanceof Element && event.target.closest('.graph') && event.dataTransfer?.types.includes('application/simflow-node-type')) event.preventDefault()
    }
    document.addEventListener('dragover', allowPaletteDrop, true)
    document.addEventListener('drop', acceptPaletteDrop, true)
    return () => { document.removeEventListener('dragover', allowPaletteDrop, true); document.removeEventListener('drop', acceptPaletteDrop, true) }
  }, [addGraphNode, flowInstance, selectedVersion?.status, versionId])

  function submitWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = { workflow_name: String(form.get('name')), workflow_desc: String(form.get('description')) || null, workspace_id: null }
    if (selectedWorkflow) update.mutate({ id: selectedWorkflow.workflow_id, payload })
    else create.mutate(payload)
  }
  function connect(connection: Connection) {
    if (!versionId || selectedVersion?.status !== 'draft' || !connection.source || !connection.target) return
    if (connection.source === connection.target) { window.alert('A node cannot connect to itself.'); return }
    if (apiEdges.some((edge) => edge.source_node_id === connection.source && edge.target_node_id === connection.target)) { window.alert('That connection already exists.'); return }
    const adjacency = new Map<string, string[]>()
    apiEdges.forEach((edge) => adjacency.set(edge.source_node_id, [...(adjacency.get(edge.source_node_id) ?? []), edge.target_node_id]))
    const pending = [connection.target]; const visited = new Set<string>()
    while (pending.length) { const nodeId = pending.pop()!; if (nodeId === connection.source) { window.alert('That connection would create a cycle.'); return }; if (!visited.has(nodeId)) { visited.add(nodeId); pending.push(...(adjacency.get(nodeId) ?? [])) } }
    addWorkflowEdge(versionId, { source_node_id: connection.source, target_node_id: connection.target, condition_configuration: null, priority: 0 }).then(() => queryClient.invalidateQueries({ queryKey: ['graph', versionId] }))
  }
  function startPaletteDrag(event: DragEvent<HTMLButtonElement>, nodeType: typeof nodeTypes[number]) {
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
    const nodeType = event.dataTransfer.getData('application/simflow-node-type') as typeof nodeTypes[number]
    if (!nodeTypes.includes(nodeType) || !flowInstance || !versionId || selectedVersion?.status !== 'draft') return
    addGraphNode.mutate({ nodeType, position: flowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY }) })
  }
  function saveStructuredNode(name: string, configuration: Record<string, unknown>) {
    if (!selectedNode) return
    persistNode.mutate({ id: selectedNode.node_id, payload: { node_name: name, node_type: selectedNode.node_type, configuration, position_x: selectedNode.position_x, position_y: selectedNode.position_y } })
  }
  function saveStructuredEdge(priority: number, condition: Record<string, unknown> | null) {
    if (!selectedEdge) return
    persistEdge.mutate({ id: selectedEdge.edge_id, payload: { source_node_id: selectedEdge.source_node_id, target_node_id: selectedEdge.target_node_id, priority, condition_configuration: condition } })
  }
  function validateGraph() { setValidationRequested(true) }
  return <main className="studio"><header className="studio-header"><div><p className="eyebrow">Workflow builder</p><h1><button className="workflow-picker-trigger" type="button" onClick={() => setWorkflowPickerOpen(true)}>{selectedWorkflow?.workflow_name ?? 'Create workflow'}</button></h1><div className="studio-meta">{selectedVersion ? <StatusBadge status={selectedVersion.status} /> : <span className="status-badge status-draft">No version selected</span>}<span className="autosave-indicator"><Save size={14} /> Autosaved locally</span></div></div><div className="studio-header-actions"><button type="button" onClick={() => navigate('/simulation')}><Play size={15} /> Preview / run</button><button className="publish-button" type="button" disabled={!selectedVersion || selectedVersion.status !== 'draft' || publish.isPending} onClick={() => selectedVersion && publish.mutate(selectedVersion.workflow_version_id)}><CheckCircle2 size={15} /> Publish</button></div></header><Dialog.Root open={workflowPickerOpen} onOpenChange={setWorkflowPickerOpen}><Dialog.Portal><Dialog.Overlay className="command-overlay" /><Dialog.Content className="workflow-picker-dialog"><Dialog.Title>Select workflow</Dialog.Title><Dialog.Description>Choose an existing workflow or create a new one.</Dialog.Description><button className="workflow-picker-create" type="button" onClick={() => { setSelectedWorkflow(null); setVersionId(null); setWorkflowPickerOpen(false) }}>Create workflow</button><div>{workflows.data?.map((item) => <button className="workflow-picker-item" type="button" key={item.workflow_id} onClick={() => { setSelectedWorkflow(item); setVersionId(null); setWorkflowPickerOpen(false) }}><span><strong>{item.workflow_name}</strong><small>{item.workflow_desc ?? 'No description'}</small></span><StatusBadge status={item.status} /></button>)}</div></Dialog.Content></Dialog.Portal></Dialog.Root>
    <div className="canvas-toolbar" aria-label="Canvas controls"><div className="toolbar-group"><button type="button" aria-label="Undo" disabled><Undo2 size={16} /></button><button type="button" aria-label="Redo" disabled><Redo2 size={16} /></button></div><div className="toolbar-group"><button type="button" aria-label="Zoom out" onClick={() => flowInstance?.zoomOut()}><Minus size={16} /></button><button type="button" aria-label="Zoom in" onClick={() => flowInstance?.zoomIn()}><Plus size={16} /></button><button type="button" aria-label="Fit canvas" onClick={() => flowInstance?.fitView()}><Maximize size={16} /></button></div><div className="toolbar-group"><button type="button" className={showMiniMap ? 'is-active' : ''} onClick={() => setShowMiniMap((current) => !current)}>Minimap</button><button type="button" className={validationRequested ? 'is-active' : ''} onClick={validateGraph}><ClipboardCheck size={16} /> Validate</button><button type="button" onClick={() => navigate('/simulation')}><Eye size={16} /> Preview</button></div></div>
    <section className="studio-grid"><aside><h2>Workflows</h2><button onClick={() => { setSelectedWorkflow(null); setVersionId(null) }}>Create workflow</button>{workflows.isPending && <LoadingState />}{workflows.data?.map((workflow) => <button className="workflow-item" key={workflow.workflow_id} onClick={() => { setSelectedWorkflow(workflow); setVersionId(null) }}>{workflow.workflow_name}<small><StatusBadge status={workflow.status} /></small></button>)}</aside>
    <section><h2>{selectedWorkflow ? `Edit ${selectedWorkflow.workflow_name}` : 'Create workflow'}</h2><form className="inline-form" key={selectedWorkflow?.workflow_id ?? 'new'} onSubmit={submitWorkflow}><input name="name" required defaultValue={selectedWorkflow?.workflow_name ?? ''} placeholder="Workflow name" /><input name="description" defaultValue={selectedWorkflow?.workflow_desc ?? ''} placeholder="Description" /><button disabled={create.isPending || update.isPending}>{selectedWorkflow ? 'Save workflow' : 'Create workflow'}</button>{selectedWorkflow && <button className="danger" type="button" disabled={removeWorkflow.isPending} onClick={() => removeWorkflow.mutate(selectedWorkflow.workflow_id)}>Delete workflow</button>}</form>{selectedWorkflow && <div className="toolbar"><button onClick={() => createDraft.mutate(selectedWorkflow.workflow_id)}>Create draft version</button><label>Version<select value={versionId ?? ''} onChange={(event) => { setVersionId(event.target.value || null); setSelectedNodeId(null); setSelectedEdgeId(null) }}><option value="">Select a version</option>{versions.data?.map((version) => <option key={version.workflow_version_id} value={version.workflow_version_id}>v{version.version_number} — {version.status}</option>)}</select></label>{selectedVersion && <span className={`version-status ${selectedVersion.status}`}>{selectedVersion.status}</span>}{selectedVersion?.status === 'draft' && <button onClick={() => publish.mutate(selectedVersion.workflow_version_id)}>Publish</button>}</div>}{validationErrors.length > 0 && <section className="validation-errors" aria-live="polite"><h3>Graph validation errors</h3><ul>{validationErrors.map((error) => <li key={error}>{error}</li>)}</ul></section>}{publish.isError && validationErrors.length === 0 && <p className="validation-errors">Unable to validate the graph. Please try again.</p>}<div className="graph" onDragOver={allowCanvasDrop} onDrop={dropPaletteNode}><ReactFlow nodeTypes={workflowNodeRenderers} edgeTypes={workflowEdgeRenderers} onInit={setFlowInstance} nodes={nodes.map((node) => ({ ...node, className: invalidNodeIds.has(node.id) ? 'invalid-node' : '', draggable: selectedVersion?.status === 'draft', connectable: selectedVersion?.status === 'draft' }))} edges={edges.map((edge) => ({ ...edge, className: invalidEdgeIds.has(edge.id) ? 'invalid-edge' : '' }))} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={connect} onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null) }} onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null) }} onNodeDragStop={(_, node) => { if (selectedVersion?.status !== 'draft') return; const current = apiNodes.find((item) => item.node_id === node.id); if (current) persistNode.mutate({ id: node.id, payload: { ...current, position_x: Math.round(node.position.x), position_y: Math.round(node.position.y) } }) }} fitView><Background /><Controls /><MiniMap /></ReactFlow></div></section>
    <aside><h2>Version history</h2>{selectedWorkflow && (versions.isPending ? <LoadingState /> : versions.data?.map((version) => <button className={`workflow-item version-item ${version.workflow_version_id === versionId ? 'selected' : ''}`} key={version.workflow_version_id} onClick={() => setVersionId(version.workflow_version_id)}>Version {version.version_number}<small>{version.status}</small></button>))}<ExecutionHistoryPanel executions={executions.data ?? []} selectedExecution={selectedExecution} timeline={executionTimeline.data ?? []} isLoading={executions.isPending || executionTimeline.isPending} onSelect={setSelectedExecutionId} /><h2>Node palette</h2><p className="palette-hint">Drag a node onto the canvas, or click to add it.</p>{nodeTypes.map((nodeType) => <button key={nodeType} draggable={Boolean(versionId && selectedVersion?.status === 'draft')} disabled={!versionId || selectedVersion?.status !== 'draft'} onDragStart={(event) => startPaletteDrag(event, nodeType)} onClick={() => addGraphNode.mutate({ nodeType })}>Add {nodeType}</button>)}{selectedNode && <NodeConfigurationForm node={selectedNode} onSave={saveStructuredNode} onDuplicate={() => duplicateGraphNode.mutate(selectedNode)} onDelete={() => removeNode.mutate(selectedNode.node_id)} />}{selectedEdge && <EdgeConfigurationForm priority={selectedEdge.priority} condition={selectedEdge.condition_configuration} onSave={saveStructuredEdge} onDelete={() => removeEdge.mutate(selectedEdge.edge_id)} />}<p>Drag nodes and connect handles to create transitions. Published versions remain immutable.</p></aside></section></main>
}

function ExecutionHistoryPanel({ executions, selectedExecution, timeline, isLoading, onSelect }: { executions: Execution[]; selectedExecution: Execution | null; timeline: { event_id: string; event_type: string; node_id: string | null; payload: Record<string, unknown> }[]; isLoading: boolean; onSelect: (executionId: string) => void }) {
  return <section className="execution-history"><h2>Execution history</h2>{isLoading && <LoadingState />}{executions.length === 0 && <p>Select a version to inspect its executions.</p>}{executions.map((execution) => <button className={`workflow-item ${selectedExecution?.execution_id === execution.execution_id ? 'selected' : ''}`} key={execution.execution_id} onClick={() => onSelect(execution.execution_id)}>{execution.participant_id ?? 'No participant'}<small>{execution.status} · {execution.execution_id}</small></button>)}{selectedExecution && <div className="execution-detail"><h3>{selectedExecution.status}</h3><p>Current node: {selectedExecution.current_node_id ?? 'completed'}</p>{timeline.map((event) => <details className={event.event_type === 'execution_failed' ? 'failure-event' : ''} key={event.event_id}><summary>{event.event_type}{event.node_id ? ` · ${event.node_id}` : ''}</summary><pre>{JSON.stringify(event.payload, null, 2)}</pre></details>)}</div>}</section>
}
