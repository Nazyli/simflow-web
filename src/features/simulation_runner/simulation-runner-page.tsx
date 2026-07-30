import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { completeExecution, getTimeline, startExecution, submitExecutionAction } from '../../shared/api/executions'
import { getWorkflows } from '../../shared/api/workflows'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import type { Execution } from '../../shared/types/workflow'

type Channel = 'chat' | 'email' | 'call' | 'document'

export function SimulationRunnerPage() {
  const [participantId, setParticipantId] = useState('')
  const [versionId, setVersionId] = useState('')
  const [channel, setChannel] = useState<Channel>('chat')
  const [execution, setExecution] = useState<Execution | null>(null)
  const workflows = useQuery({ queryKey: ['workflows'], queryFn: getWorkflows })
  const timeline = useQuery({ queryKey: ['timeline', execution?.execution_id], queryFn: () => getTimeline(execution!.execution_id), enabled: Boolean(execution) })
  const start = useMutation({ mutationFn: startExecution, onSuccess: setExecution })
  const action = useMutation({ mutationFn: ({ actionType, content }: { actionType: string; content: string }) => submitExecutionAction(execution!.execution_id, { action_type: actionType, payload: { content, channel } }), onSuccess: setExecution })
  const complete = useMutation({ mutationFn: () => completeExecution(execution!.execution_id), onSuccess: setExecution })

  function startSimulation(event: FormEvent<HTMLFormElement>) { event.preventDefault(); start.mutate({ workflow_version_id: versionId, participant_id: participantId, context: { channel } }) }
  function sendAction(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const content = String(new FormData(event.currentTarget).get('content')); action.mutate({ actionType: 'message', content }); event.currentTarget.reset() }
  function restart() { setExecution(null); setParticipantId(''); setVersionId('') }
  const aiResult = execution?.context.last_ai_result as { content?: string; label?: string; score?: number } | undefined

  return <main><header><div><h1>Simulation Runner</h1><p>Run a simulation by participant ID.</p></div><Link to="/studio">Open Simulation Studio</Link></header>
    {!execution && <form onSubmit={startSimulation}><label htmlFor="participant-id">Participant ID</label><input id="participant-id" required value={participantId} onChange={(event) => setParticipantId(event.target.value)} /><label htmlFor="workflow-version">Workflow version ID</label><input id="workflow-version" required value={versionId} onChange={(event) => setVersionId(event.target.value)} placeholder="Published version UUID" /><label htmlFor="channel">Channel</label><select id="channel" value={channel} onChange={(event) => setChannel(event.target.value as Channel)}>{(['chat', 'email', 'call', 'document'] as Channel[]).map((item) => <option key={item}>{item}</option>)}</select><button disabled={start.isPending}>Start simulation</button>{start.isError && <ErrorState message="Unable to start. Use a published workflow version ID." />}{workflows.data && <p>{workflows.data.length} workflow definition(s) available in Studio.</p>}</form>}
    {execution && <section className="runner"><div><h2>{channel.toUpperCase()} channel</h2><ChannelPanel channel={channel} /><form onSubmit={sendAction}><label htmlFor="content">Your action</label><input id="content" name="content" required placeholder="Write a message or action" /><button disabled={action.isPending}>Send action</button></form></div><aside><h2>Execution</h2><p>Status: {execution.status}</p><p>Current node: {execution.current_node_id ?? 'completed'}</p>{aiResult && <div className="dummy-ai"><strong>Dummy AI</strong><p>{aiResult.content ?? `${aiResult.label} (${aiResult.score ?? 0})`}</p></div>}<button onClick={() => complete.mutate()} disabled={execution.status !== 'running'}>Complete simulation</button>{execution.status !== 'running' && <><h2>Completion summary</h2><p>Simulation {execution.status} for {execution.participant_id}.</p><button onClick={restart}>Restart</button></>}<h2>Timeline</h2>{timeline.isPending && <LoadingState />}{timeline.data?.map((event) => <p key={event.event_id}>{event.event_type}</p>)}</aside></section>}</main>
}

function ChannelPanel({ channel }: { channel: Channel }) {
  const labels: Record<Channel, string> = { chat: 'Chat conversation', email: 'Email inbox', call: 'Call session', document: 'Shared document' }
  return <div className="channel-panel"><h3>{labels[channel]}</h3><p>Channel events will appear here as the workflow advances.</p></div>
}
