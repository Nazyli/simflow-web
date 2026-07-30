import '@xyflow/react/dist/style.css'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from '@xyflow/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getMasterData } from '../../shared/api/master-data'
import { createVersion, createWorkflow, getWorkflows, publishVersion } from '../../shared/api/workflows'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import type { Workflow } from '../../shared/types/workflow'

const initialNodes: Node[] = [{ id: 'trigger', position: { x: 80, y: 100 }, data: { label: 'Manual trigger' }, type: 'input' }, { id: 'action', position: { x: 360, y: 100 }, data: { label: 'Dummy AI action' } }]
const initialEdges: Edge[] = [{ id: 'trigger-action', source: 'trigger', target: 'action', label: 'default' }]

export function SimulationStudioPage() {
  const queryClient = useQueryClient()
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [versionId, setVersionId] = useState<string | null>(null)
  const [nodes] = useState(initialNodes)
  const [edges] = useState(initialEdges)
  const workflows = useQuery({ queryKey: ['workflows'], queryFn: getWorkflows })
  const actors = useQuery({ queryKey: ['master', 'actors'], queryFn: () => getMasterData('actors') })
  const create = useMutation({ mutationFn: createWorkflow, onSuccess: (workflow) => { setSelectedWorkflow(workflow); queryClient.invalidateQueries({ queryKey: ['workflows'] }) } })
  const createDraft = useMutation({ mutationFn: createVersion, onSuccess: (version) => setVersionId(version.workflow_version_id) })
  const publish = useMutation({ mutationFn: publishVersion })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    create.mutate({ workflow_name: String(form.get('name')), workflow_desc: String(form.get('description')) || null, workspace_id: null })
  }
  return <main className="studio"><header><div><h1>Simulation Studio</h1><p>Master data and workflow configuration.</p></div><Link to="/simulation">Open Simulation Runner</Link></header>
    <section className="studio-grid"><aside><h2>Master data</h2>{actors.isPending && <LoadingState />}{actors.isError && <ErrorState message="Unable to load actors." />}{actors.data && <p>{actors.data.length} actors available</p>}<h2>Workflows</h2>{workflows.isPending && <LoadingState />}{workflows.data?.map((workflow) => <button className="workflow-item" key={workflow.workflow_id} onClick={() => setSelectedWorkflow(workflow)}>{workflow.workflow_name}<small>{workflow.status}</small></button>)}</aside>
    <section><h2>{selectedWorkflow ? selectedWorkflow.workflow_name : 'Create workflow'}</h2><form onSubmit={submit}><input name="name" required placeholder="Workflow name" /><input name="description" placeholder="Description" /><button disabled={create.isPending}>Create workflow</button></form>{selectedWorkflow && <div className="toolbar"><button onClick={() => createDraft.mutate(selectedWorkflow.workflow_id)}>Create draft version</button>{versionId && <><span>Draft: {versionId}</span><button onClick={() => publish.mutate(versionId)}>Publish</button></>}{publish.isError && <ErrorState message="Graph validation failed. Check trigger, edges, and orphan nodes." />}</div>}<div className="graph"><ReactFlow nodes={nodes} edges={edges} fitView><Background /><Controls /><MiniMap /></ReactFlow></div></section>
    <aside><h2>Node palette</h2><p>Trigger · Condition · Action · Event</p><h2>Configuration</h2><p>Select a node to configure its dummy-AI provider, fixture, and seed.</p><h2>Edge inspector</h2><p>{edges.length} transition(s); priority and condition are configured per edge.</p><h2>Execution history</h2><p>Choose an execution to inspect events and failed node results.</p></aside></section></main>
}
