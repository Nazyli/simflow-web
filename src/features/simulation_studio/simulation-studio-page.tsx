import '@xyflow/react/dist/style.css'
import { Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState, type Connection, type Edge, type Node } from '@xyflow/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getMasterData, updateMasterData } from '../../shared/api/master-data'
import { addNode, addWorkflowEdge, createVersion, createWorkflow, deleteNode, deleteWorkflowEdge, getGraph, getWorkflows, publishVersion, updateNode, updateWorkflowEdge, type ApiEdge, type ApiNode } from '../../shared/api/workflows'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import type { Workflow } from '../../shared/types/workflow'

const resources = ['actors', 'simulations', 'activities', 'documents', 'emails', 'chats', 'calls', 'prompts', 'scenarios']
const nodeTypes = ['trigger', 'condition', 'action', 'event'] as const
const emptyNodes: ApiNode[] = []
const emptyEdges: ApiEdge[] = []

function nodeToFlow(node: ApiNode): Node { return { id: node.node_id, position: { x: node.position_x ?? 80, y: node.position_y ?? 80 }, data: { label: node.node_name, type: node.node_type } } }
function edgeToFlow(edge: ApiEdge): Edge { return { id: edge.edge_id, source: edge.source_node_id, target: edge.target_node_id, label: `P${edge.priority}` } }

export function SimulationStudioPage() {
  const queryClient = useQueryClient()
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [versionId, setVersionId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [resource, setResource] = useState(resources[0])
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const workflows = useQuery({ queryKey: ['workflows'], queryFn: getWorkflows })
  const masterData = useQuery({ queryKey: ['master', resource], queryFn: () => getMasterData(resource) })
  const graph = useQuery({ queryKey: ['graph', versionId], queryFn: () => getGraph(versionId!), enabled: Boolean(versionId) })
  const create = useMutation({ mutationFn: createWorkflow, onSuccess: (workflow) => { setSelectedWorkflow(workflow); queryClient.invalidateQueries({ queryKey: ['workflows'] }) } })
  const createDraft = useMutation({ mutationFn: createVersion, onSuccess: (version) => { setVersionId(version.workflow_version_id); setSelectedNodeId(null); setSelectedEdgeId(null) } })
  const publish = useMutation({ mutationFn: publishVersion, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }) })
  const addGraphNode = useMutation({ mutationFn: (nodeType: typeof nodeTypes[number]) => addNode(versionId!, { node_name: `${nodeType} node`, node_type: nodeType, configuration: nodeType === 'action' ? { channel: 'chat', await_participant: false } : {}, position_x: 180, position_y: 180 }), onSuccess: (node) => { setSelectedNodeId(node.node_id); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) } })
  const persistNode = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<ApiNode, 'node_id'> }) => updateNode(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) })
  const removeNode = useMutation({ mutationFn: deleteNode, onSuccess: () => { setSelectedNodeId(null); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) } })
  const persistEdge = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<ApiEdge, 'edge_id'> }) => updateWorkflowEdge(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) })
  const removeEdge = useMutation({ mutationFn: deleteWorkflowEdge, onSuccess: () => { setSelectedEdgeId(null); queryClient.invalidateQueries({ queryKey: ['graph', versionId] }) } })
  const updateRecord = useMutation({ mutationFn: ({ id, values }: { id: string; values: Record<string, unknown> }) => updateMasterData(resource, id, values), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master', resource] }) })
  const apiNodes = graph.data?.[0] ?? emptyNodes
  const apiEdges = graph.data?.[1] ?? emptyEdges
  const selectedNode = useMemo(() => apiNodes.find((node) => node.node_id === selectedNodeId) ?? null, [apiNodes, selectedNodeId])
  const selectedEdge = useMemo(() => apiEdges.find((edge) => edge.edge_id === selectedEdgeId) ?? null, [apiEdges, selectedEdgeId])

  useEffect(() => { setNodes(apiNodes.map(nodeToFlow)); setEdges(apiEdges.map(edgeToFlow)) }, [apiNodes, apiEdges, setNodes, setEdges])
  useEffect(() => { setSelectedRecord(null) }, [resource])

  function submitWorkflow(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); create.mutate({ workflow_name: String(form.get('name')), workflow_desc: String(form.get('description')) || null, workspace_id: null }) }
  function connect(connection: Connection) {
    if (!versionId || !connection.source || !connection.target) return
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
  function saveMaster(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedRecord) return
    const form = new FormData(event.currentTarget); const id = String(selectedRecord[Object.keys(selectedRecord)[0]])
    try { updateRecord.mutate({ id, values: JSON.parse(String(form.get('values'))) as Record<string, unknown> }) } catch { return }
  }

  return <main className="studio"><header><div><h1>Simulation Studio</h1><p>Configure master data, workflow versions, nodes, and transitions.</p></div><Link to="/simulation">Open Simulation Runner</Link></header>
    <section className="studio-grid"><aside><h2>Master data</h2><select value={resource} onChange={(event) => setResource(event.target.value)}>{resources.map((item) => <option key={item}>{item}</option>)}</select>{masterData.isPending && <LoadingState />}{masterData.data?.map((record, index) => <button className="workflow-item" key={index} onClick={() => setSelectedRecord(record)}>{String(record[Object.keys(record)[0]])}</button>)}{selectedRecord && <form onSubmit={saveMaster}><textarea name="values" defaultValue={JSON.stringify(selectedRecord, null, 2)} rows={10} /><button>Save record</button></form>}<h2>Workflows</h2>{workflows.isPending && <LoadingState />}{workflows.data?.map((workflow) => <button className="workflow-item" key={workflow.workflow_id} onClick={() => { setSelectedWorkflow(workflow); setVersionId(null) }}>{workflow.workflow_name}<small>{workflow.status}</small></button>)}</aside>
    <section><h2>{selectedWorkflow ? selectedWorkflow.workflow_name : 'Create workflow'}</h2><form className="inline-form" onSubmit={submitWorkflow}><input name="name" required placeholder="Workflow name" /><input name="description" placeholder="Description" /><button disabled={create.isPending}>Create workflow</button></form>{selectedWorkflow && <div className="toolbar"><button onClick={() => createDraft.mutate(selectedWorkflow.workflow_id)}>Create draft version</button>{versionId && <><span>Draft: {versionId}</span><button onClick={() => publish.mutate(versionId)}>Publish</button></>}{publish.isError && <ErrorState message="Graph validation failed. A graph needs one connected trigger and valid node configuration." />}</div>}<div className="graph"><ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={connect} onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null) }} onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null) }} onNodeDragStop={(_, node) => { const current = apiNodes.find((item) => item.node_id === node.id); if (current) persistNode.mutate({ id: node.id, payload: { ...current, position_x: Math.round(node.position.x), position_y: Math.round(node.position.y) } }) }} fitView><Background /><Controls /><MiniMap /></ReactFlow></div></section>
    <aside><h2>Node palette</h2>{nodeTypes.map((nodeType) => <button key={nodeType} disabled={!versionId} onClick={() => addGraphNode.mutate(nodeType)}>Add {nodeType}</button>)}{selectedNode && <form onSubmit={saveNode}><h2>Node configuration</h2><input name="node_name" defaultValue={selectedNode.node_name} required /><label>Channel<select name="channel" defaultValue={String(selectedNode.configuration.channel ?? 'chat')}><option>chat</option><option>email</option><option>call</option><option>document</option></select></label><input name="content" defaultValue={String(selectedNode.configuration.content ?? '')} placeholder="Message/content" /><label><input name="await_participant" type="checkbox" defaultChecked={Boolean(selectedNode.configuration.await_participant)} /> Wait for participant</label>{selectedNode.node_type === 'trigger' && <><label><input name="timer" type="checkbox" defaultChecked={selectedNode.configuration.trigger_type === 'timer'} /> Timer trigger</label><input name="delay_seconds" type="number" min="0" defaultValue={String(selectedNode.configuration.delay_seconds ?? 0)} /></>}{selectedNode.node_type === 'condition' && <><input name="field" defaultValue={String(selectedNode.configuration.field ?? '')} placeholder="Context field" /><input name="equals" defaultValue={String(selectedNode.configuration.equals ?? '')} placeholder="Expected value" /></>}{selectedNode.node_type === 'action' && <><label><input name="ai" type="checkbox" defaultChecked={selectedNode.configuration.provider === 'dummy'} /> Dummy AI</label><select name="operation" defaultValue={String(selectedNode.configuration.operation ?? 'response')}><option value="response">Response</option><option value="classification">Classification</option></select></>}<textarea name="fixture" defaultValue={JSON.stringify(selectedNode.configuration.fixture ?? {}, null, 2)} rows={5} placeholder="AI fixture JSON" /><button>Save node</button><button type="button" onClick={() => removeNode.mutate(selectedNode.node_id)}>Delete node</button></form>}{selectedEdge && <form onSubmit={saveEdge}><h2>Edge inspector</h2><input name="priority" type="number" defaultValue={selectedEdge.priority} /><input name="field" defaultValue={String(selectedEdge.condition_configuration?.field ?? '')} placeholder="Context field (optional)" /><input name="equals" defaultValue={String(selectedEdge.condition_configuration?.equals ?? '')} placeholder="Expected value" /><button>Save edge</button><button type="button" onClick={() => removeEdge.mutate(selectedEdge.edge_id)}>Delete edge</button></form>}<p>Drag nodes and connect handles to create transitions. Published versions remain immutable.</p></aside></section></main>
}
