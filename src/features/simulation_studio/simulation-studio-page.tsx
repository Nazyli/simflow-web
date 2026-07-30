import '@xyflow/react/dist/style.css'
import { Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState, type Connection, type Edge, type Node } from '@xyflow/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../shared/api/client'
import { createMasterData, deleteMasterData, getMasterData, updateMasterData } from '../../shared/api/master-data'
import { getExecutions, getTimeline } from '../../shared/api/executions'
import { addNode, addWorkflowEdge, createVersion, createWorkflow, deleteNode, deleteWorkflow, deleteWorkflowEdge, getGraph, getWorkflowVersions, getWorkflows, publishVersion, updateNode, updateWorkflow, updateWorkflowEdge, type ApiEdge, type ApiNode } from '../../shared/api/workflows'
import { LoadingState } from '../../shared/components/async-state'
import type { Execution, Workflow } from '../../shared/types/workflow'
import { MasterDataForm } from './master-data-form'

const masterResources = ['actors', 'simulations', 'activities', 'documents', 'emails', 'chats', 'calls', 'prompts', 'scenarios'] as const
type MasterResource = typeof masterResources[number]
const nodeTypes = ['trigger', 'condition', 'action', 'event'] as const
const emptyNodes: ApiNode[] = []
const emptyEdges: ApiEdge[] = []

function nodeToFlow(node: ApiNode): Node { return { id: node.node_id, position: { x: node.position_x ?? 80, y: node.position_y ?? 80 }, data: { label: node.node_name, type: node.node_type } } }
function edgeToFlow(edge: ApiEdge): Edge { return { id: edge.edge_id, source: edge.source_node_id, target: edge.target_node_id, label: `P${edge.priority}` } }

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
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [versionId, setVersionId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)
  const [resource, setResource] = useState<MasterResource>(masterResources[0])
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const workflows = useQuery({ queryKey: ['workflows'], queryFn: getWorkflows })
  const masterData = useQuery({ queryKey: ['master', resource], queryFn: () => getMasterData(resource) })
  const graph = useQuery({ queryKey: ['graph', versionId], queryFn: () => getGraph(versionId!), enabled: Boolean(versionId) })
  const versions = useQuery({ queryKey: ['workflow-versions', selectedWorkflow?.workflow_id], queryFn: () => getWorkflowVersions(selectedWorkflow!.workflow_id), enabled: Boolean(selectedWorkflow) })
  const executions = useQuery({ queryKey: ['executions', versionId], queryFn: () => getExecutions(versionId!), enabled: Boolean(versionId) })
  const executionTimeline = useQuery({ queryKey: ['execution-timeline', selectedExecutionId], queryFn: () => getTimeline(selectedExecutionId!), enabled: Boolean(selectedExecutionId) })
  const create = useMutation({ mutationFn: createWorkflow, onSuccess: (workflow) => { setSelectedWorkflow(workflow); queryClient.invalidateQueries({ queryKey: ['workflows'] }) } })
  const update = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Pick<Workflow, 'workflow_name' | 'workflow_desc' | 'workspace_id'> }) => updateWorkflow(id, payload), onSuccess: (workflow) => { setSelectedWorkflow(workflow); queryClient.invalidateQueries({ queryKey: ['workflows'] }) } })
  const removeWorkflow = useMutation({ mutationFn: deleteWorkflow, onSuccess: () => { setSelectedWorkflow(null); setVersionId(null); setSelectedNodeId(null); setSelectedEdgeId(null); setNodes([]); setEdges([]); queryClient.invalidateQueries({ queryKey: ['workflows'] }) } })
  const createDraft = useMutation({ mutationFn: createVersion, onSuccess: (version) => { setVersionId(version.workflow_version_id); setSelectedNodeId(null); setSelectedEdgeId(null); queryClient.invalidateQueries({ queryKey: ['workflow-versions', selectedWorkflow?.workflow_id] }) } })
  const publish = useMutation({ mutationFn: publishVersion, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); queryClient.invalidateQueries({ queryKey: ['workflow-versions', selectedWorkflow?.workflow_id] }) } })
  const addGraphNode = useMutation({ mutationFn: (nodeType: typeof nodeTypes[number]) => addNode(versionId!, { node_name: `${nodeType} node`, node_type: nodeType, configuration: nodeType === 'action' ? { channel: 'chat', await_participant: false } : {}, position_x: 180, position_y: 180 }), onSuccess: (node) => { setSelectedNodeId(node.node_id); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) } })
  const duplicateGraphNode = useMutation({ mutationFn: (node: ApiNode) => addNode(versionId!, { node_name: `${node.node_name} copy`, node_type: node.node_type, configuration: { ...node.configuration }, position_x: (node.position_x ?? 80) + 60, position_y: (node.position_y ?? 80) + 60 }), onSuccess: (node) => { setSelectedNodeId(node.node_id); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) } })
  const persistNode = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<ApiNode, 'node_id'> }) => updateNode(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) })
  const removeNode = useMutation({ mutationFn: deleteNode, onSuccess: () => { setSelectedNodeId(null); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) } })
  const persistEdge = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<ApiEdge, 'edge_id'> }) => updateWorkflowEdge(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) })
  const removeEdge = useMutation({ mutationFn: deleteWorkflowEdge, onSuccess: () => { setSelectedEdgeId(null); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) } })
  const createRecord = useMutation({ mutationFn: (values: Record<string, unknown>) => createMasterData(resource, values), onSuccess: () => { setSelectedRecord(null); queryClient.invalidateQueries({ queryKey: ['master', resource] }) } })
  const updateRecord = useMutation({ mutationFn: ({ id, values }: { id: string; values: Record<string, unknown> }) => updateMasterData(resource, id, values), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master', resource] }) })
  const removeRecord = useMutation({ mutationFn: (id: string) => deleteMasterData(resource, id), onSuccess: () => { setSelectedRecord(null); queryClient.invalidateQueries({ queryKey: ['master', resource] }) } })
  const apiNodes = graph.data?.[0] ?? emptyNodes
  const apiEdges = graph.data?.[1] ?? emptyEdges
  const selectedNode = useMemo(() => apiNodes.find((node) => node.node_id === selectedNodeId) ?? null, [apiNodes, selectedNodeId])
  const selectedEdge = useMemo(() => apiEdges.find((edge) => edge.edge_id === selectedEdgeId) ?? null, [apiEdges, selectedEdgeId])
  const selectedVersion = versions.data?.find((version) => version.workflow_version_id === versionId)
  const selectedExecution = executions.data?.find((execution) => execution.execution_id === selectedExecutionId) ?? null
  const validationErrors = useMemo(() => publishErrors(publish.error), [publish.error])
  const invalidNodeIds = useMemo(() => new Set(validationErrors.flatMap((error) => [...error.matchAll(/Node '([^']+)'/g)].map((match) => match[1]))), [validationErrors])
  const invalidEdgeIds = useMemo(() => new Set(validationErrors.flatMap((error) => [...error.matchAll(/Edge '([^']+)'/g)].map((match) => match[1]))), [validationErrors])

  useEffect(() => { setNodes(apiNodes.map(nodeToFlow)); setEdges(apiEdges.map(edgeToFlow)) }, [apiNodes, apiEdges, setNodes, setEdges])
  useEffect(() => { setSelectedRecord(null) }, [resource])
  useEffect(() => { setSelectedExecutionId(null) }, [versionId])

  function submitWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = { workflow_name: String(form.get('name')), workflow_desc: String(form.get('description')) || null, workspace_id: null }
    if (selectedWorkflow) update.mutate({ id: selectedWorkflow.workflow_id, payload })
    else create.mutate(payload)
  }
  function connect(connection: Connection) {
    if (!versionId || selectedVersion?.status !== 'draft' || !connection.source || !connection.target) return
    addWorkflowEdge(versionId, { source_node_id: connection.source, target_node_id: connection.target, condition_configuration: null, priority: 0 }).then(() => queryClient.invalidateQueries({ queryKey: ['graph', versionId] }))
  }
  function saveNode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedNode) return
    const form = new FormData(event.currentTarget)
    let fixture: Record<string, unknown> = {}
    try { fixture = JSON.parse(String(form.get('fixture') || '{}')) as Record<string, unknown> } catch { return }
    const configuration: Record<string, unknown> = { ...selectedNode.configuration, channel: String(form.get('channel') || 'chat'), content: String(form.get('content') || ''), await_participant: form.get('await_participant') === 'on', fixture }
    if (selectedNode.node_type === 'trigger' && form.get('timer') === 'on') { configuration.trigger_type = 'timer'; configuration.delay_seconds = Number(form.get('delay_seconds') || 0) }
    if (selectedNode.node_type === 'condition') { configuration.field = String(form.get('field')); configuration.equals = String(form.get('equals')) }
    if (selectedNode.node_type === 'action' && form.get('ai') === 'on') { configuration.provider = 'dummy'; configuration.operation = String(form.get('operation')) } else { delete configuration.provider; delete configuration.operation }
    persistNode.mutate({ id: selectedNode.node_id, payload: { node_name: String(form.get('node_name')), node_type: selectedNode.node_type, configuration, position_x: selectedNode.position_x, position_y: selectedNode.position_y } })
  }
  function saveEdge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedEdge) return
    const form = new FormData(event.currentTarget); const field = String(form.get('field'))
    persistEdge.mutate({ id: selectedEdge.edge_id, payload: { source_node_id: selectedEdge.source_node_id, target_node_id: selectedEdge.target_node_id, priority: Number(form.get('priority')), condition_configuration: field ? { field, equals: String(form.get('equals')) } : null } })
  }
  return <main className="studio"><header><div><h1>Simulation Studio</h1><p>Configure master data, workflow versions, nodes, and transitions.</p></div><Link to="/simulation">Open Simulation Runner</Link></header>
    <section className="studio-grid"><aside><h2>Master data</h2><select value={resource} onChange={(event) => setResource(event.target.value as MasterResource)}>{masterResources.map((item) => <option key={item}>{item}</option>)}</select><button onClick={() => setSelectedRecord(null)}>Create {resource.slice(0, -1)}</button>{masterData.isPending && <LoadingState />}{masterData.data?.map((record, index) => <button className="workflow-item" key={index} onClick={() => setSelectedRecord(record)}>{String(record[Object.keys(record)[0]])}</button>)}<MasterDataForm resource={resource} record={selectedRecord} isSaving={createRecord.isPending || updateRecord.isPending || removeRecord.isPending} onSave={(id, values) => id ? updateRecord.mutate({ id, values }) : createRecord.mutate(values)} onDelete={(id) => removeRecord.mutate(id)} /><h2>Workflows</h2><button onClick={() => { setSelectedWorkflow(null); setVersionId(null) }}>Create workflow</button>{workflows.isPending && <LoadingState />}{workflows.data?.map((workflow) => <button className="workflow-item" key={workflow.workflow_id} onClick={() => { setSelectedWorkflow(workflow); setVersionId(null) }}>{workflow.workflow_name}<small>{workflow.status}</small></button>)}</aside>
    <section><h2>{selectedWorkflow ? `Edit ${selectedWorkflow.workflow_name}` : 'Create workflow'}</h2><form className="inline-form" key={selectedWorkflow?.workflow_id ?? 'new'} onSubmit={submitWorkflow}><input name="name" required defaultValue={selectedWorkflow?.workflow_name ?? ''} placeholder="Workflow name" /><input name="description" defaultValue={selectedWorkflow?.workflow_desc ?? ''} placeholder="Description" /><button disabled={create.isPending || update.isPending}>{selectedWorkflow ? 'Save workflow' : 'Create workflow'}</button>{selectedWorkflow && <button className="danger" type="button" disabled={removeWorkflow.isPending} onClick={() => removeWorkflow.mutate(selectedWorkflow.workflow_id)}>Delete workflow</button>}</form>{selectedWorkflow && <div className="toolbar"><button onClick={() => createDraft.mutate(selectedWorkflow.workflow_id)}>Create draft version</button><label>Version<select value={versionId ?? ''} onChange={(event) => { setVersionId(event.target.value || null); setSelectedNodeId(null); setSelectedEdgeId(null) }}><option value="">Select a version</option>{versions.data?.map((version) => <option key={version.workflow_version_id} value={version.workflow_version_id}>v{version.version_number} — {version.status}</option>)}</select></label>{selectedVersion && <span className={`version-status ${selectedVersion.status}`}>{selectedVersion.status}</span>}{selectedVersion?.status === 'draft' && <button onClick={() => publish.mutate(selectedVersion.workflow_version_id)}>Publish</button>}</div>}{validationErrors.length > 0 && <section className="validation-errors" aria-live="polite"><h3>Graph validation errors</h3><ul>{validationErrors.map((error) => <li key={error}>{error}</li>)}</ul></section>}{publish.isError && validationErrors.length === 0 && <p className="validation-errors">Unable to validate the graph. Please try again.</p>}<div className="graph"><ReactFlow nodes={nodes.map((node) => ({ ...node, className: invalidNodeIds.has(node.id) ? 'invalid-node' : '', draggable: selectedVersion?.status === 'draft', connectable: selectedVersion?.status === 'draft' }))} edges={edges.map((edge) => ({ ...edge, className: invalidEdgeIds.has(edge.id) ? 'invalid-edge' : '' }))} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={connect} onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null) }} onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null) }} onNodeDragStop={(_, node) => { if (selectedVersion?.status !== 'draft') return; const current = apiNodes.find((item) => item.node_id === node.id); if (current) persistNode.mutate({ id: node.id, payload: { ...current, position_x: Math.round(node.position.x), position_y: Math.round(node.position.y) } }) }} fitView><Background /><Controls /><MiniMap /></ReactFlow></div></section>
    <aside><h2>Version history</h2>{selectedWorkflow && (versions.isPending ? <LoadingState /> : versions.data?.map((version) => <button className={`workflow-item version-item ${version.workflow_version_id === versionId ? 'selected' : ''}`} key={version.workflow_version_id} onClick={() => setVersionId(version.workflow_version_id)}>Version {version.version_number}<small>{version.status}</small></button>))}<ExecutionHistoryPanel executions={executions.data ?? []} selectedExecution={selectedExecution} timeline={executionTimeline.data ?? []} isLoading={executions.isPending || executionTimeline.isPending} onSelect={setSelectedExecutionId} /><h2>Node palette</h2>{nodeTypes.map((nodeType) => <button key={nodeType} disabled={!versionId || selectedVersion?.status !== 'draft'} onClick={() => addGraphNode.mutate(nodeType)}>Add {nodeType}</button>)}{selectedNode && <form onSubmit={saveNode}><h2>Node configuration</h2><input name="node_name" defaultValue={selectedNode.node_name} required /><label>Channel<select name="channel" defaultValue={String(selectedNode.configuration.channel ?? 'chat')}><option>chat</option><option>email</option><option>call</option><option>document</option></select></label><input name="content" defaultValue={String(selectedNode.configuration.content ?? '')} placeholder="Message/content" /><label><input name="await_participant" type="checkbox" defaultChecked={Boolean(selectedNode.configuration.await_participant)} /> Wait for participant</label>{selectedNode.node_type === 'trigger' && <><label><input name="timer" type="checkbox" defaultChecked={selectedNode.configuration.trigger_type === 'timer'} /> Timer trigger</label><input name="delay_seconds" type="number" min="0" defaultValue={String(selectedNode.configuration.delay_seconds ?? 0)} /></>}{selectedNode.node_type === 'condition' && <><input name="field" defaultValue={String(selectedNode.configuration.field ?? '')} placeholder="Context field" /><input name="equals" defaultValue={String(selectedNode.configuration.equals ?? '')} placeholder="Expected value" /></>}{selectedNode.node_type === 'action' && <><label><input name="ai" type="checkbox" defaultChecked={selectedNode.configuration.provider === 'dummy'} /> Dummy AI</label><select name="operation" defaultValue={String(selectedNode.configuration.operation ?? 'response')}><option value="response">Response</option><option value="classification">Classification</option></select></>}<textarea name="fixture" defaultValue={JSON.stringify(selectedNode.configuration.fixture ?? {}, null, 2)} rows={5} placeholder="AI fixture JSON" /><button disabled={selectedVersion?.status !== 'draft'}>Save node</button><button type="button" disabled={selectedVersion?.status !== 'draft'} onClick={() => duplicateGraphNode.mutate(selectedNode)}>Duplicate node</button><button type="button" disabled={selectedVersion?.status !== 'draft'} onClick={() => removeNode.mutate(selectedNode.node_id)}>Delete node</button></form>}{selectedEdge && <form onSubmit={saveEdge}><h2>Edge inspector</h2><input name="priority" type="number" defaultValue={selectedEdge.priority} /><input name="field" defaultValue={String(selectedEdge.condition_configuration?.field ?? '')} placeholder="Context field (optional)" /><input name="equals" defaultValue={String(selectedEdge.condition_configuration?.equals ?? '')} placeholder="Expected value" /><button disabled={selectedVersion?.status !== 'draft'}>Save edge</button><button type="button" disabled={selectedVersion?.status !== 'draft'} onClick={() => removeEdge.mutate(selectedEdge.edge_id)}>Delete edge</button></form>}<p>Drag nodes and connect handles to create transitions. Published versions remain immutable.</p></aside></section></main>
}

function ExecutionHistoryPanel({ executions, selectedExecution, timeline, isLoading, onSelect }: { executions: Execution[]; selectedExecution: Execution | null; timeline: { event_id: string; event_type: string; node_id: string | null; payload: Record<string, unknown> }[]; isLoading: boolean; onSelect: (executionId: string) => void }) {
  return <section className="execution-history"><h2>Execution history</h2>{isLoading && <LoadingState />}{executions.length === 0 && <p>Select a version to inspect its executions.</p>}{executions.map((execution) => <button className={`workflow-item ${selectedExecution?.execution_id === execution.execution_id ? 'selected' : ''}`} key={execution.execution_id} onClick={() => onSelect(execution.execution_id)}>{execution.participant_id ?? 'No participant'}<small>{execution.status} · {execution.execution_id}</small></button>)}{selectedExecution && <div className="execution-detail"><h3>{selectedExecution.status}</h3><p>Current node: {selectedExecution.current_node_id ?? 'completed'}</p>{timeline.map((event) => <details className={event.event_type === 'execution_failed' ? 'failure-event' : ''} key={event.event_id}><summary>{event.event_type}{event.node_id ? ` · ${event.node_id}` : ''}</summary><pre>{JSON.stringify(event.payload, null, 2)}</pre></details>)}</div>}</section>
}
