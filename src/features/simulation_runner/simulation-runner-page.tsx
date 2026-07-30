import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { completeExecution, getTimeline, startExecution, submitExecutionAction } from '../../shared/api/executions'
import { getPublishedVersions } from '../../shared/api/workflows'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import type { Execution } from '../../shared/types/workflow'

type Channel = 'chat' | 'email' | 'call' | 'document'
type ChannelEvent = { channel: Channel; actor: 'participant' | 'system'; content: string; action_type: string }

export function SimulationRunnerPage() {
  const queryClient = useQueryClient()
  const [participantId, setParticipantId] = useState('')
  const [versionId, setVersionId] = useState('')
  const [channel, setChannel] = useState<Channel>('chat')
  const [execution, setExecution] = useState<Execution | null>(null)
  const versions = useQuery({ queryKey: ['published-versions'], queryFn: getPublishedVersions })
  const timeline = useQuery({ queryKey: ['timeline', execution?.execution_id], queryFn: () => getTimeline(execution!.execution_id), enabled: Boolean(execution) })
  const start = useMutation({ mutationFn: startExecution, onSuccess: (result) => { setExecution(result); queryClient.invalidateQueries({ queryKey: ['timeline', result.execution_id] }) } })
  const action = useMutation({ mutationFn: ({ actionType, content }: { actionType: string; content: string }) => submitExecutionAction(execution!.execution_id, { action_type: actionType, payload: { content, channel } }), onSuccess: (result) => { setExecution(result); queryClient.invalidateQueries({ queryKey: ['timeline', result.execution_id] }) } })
  const complete = useMutation({ mutationFn: () => completeExecution(execution!.execution_id), onSuccess: setExecution })
  const events = (execution?.context.channel_events as ChannelEvent[] | undefined)?.filter((event) => event.channel === channel) ?? []
  const aiResult = execution?.context.last_ai_result as { content?: string; label?: string; score?: number } | undefined

  function startSimulation(event: FormEvent<HTMLFormElement>) { event.preventDefault(); start.mutate({ workflow_version_id: versionId, participant_id: participantId, context: { channel } }) }
  function sendAction(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const content = String(new FormData(event.currentTarget).get('content')); action.mutate({ actionType: 'message', content }); event.currentTarget.reset() }
  function restart() { setExecution(null); setParticipantId(''); setVersionId('') }

  return <main><header><div><h1>Simulation Runner</h1><p>Run a published workflow for one participant.</p></div><Link to="/studio">Open Simulation Studio</Link></header>
    {!execution && <form className="runner-start" onSubmit={startSimulation}><label htmlFor="participant-id">Participant ID</label><input id="participant-id" required value={participantId} onChange={(event) => setParticipantId(event.target.value)} /><label htmlFor="workflow-version">Published workflow version</label><select id="workflow-version" required value={versionId} onChange={(event) => setVersionId(event.target.value)}><option value="">Select version</option>{versions.data?.map((version) => <option key={version.workflow_version_id} value={version.workflow_version_id}>Version {version.version_number} — {version.workflow_version_id}</option>)}</select><label htmlFor="channel">Channel</label><select id="channel" value={channel} onChange={(event) => setChannel(event.target.value as Channel)}>{(['chat', 'email', 'call', 'document'] as Channel[]).map((item) => <option key={item}>{item}</option>)}</select><button disabled={start.isPending || !versionId}>Start simulation</button>{versions.isPending && <LoadingState />}{start.isError && <ErrorState message="Unable to start the selected published workflow." />}</form>}
    {execution && <section className="runner"><div><div className="channel-tabs">{(['chat', 'email', 'call', 'document'] as Channel[]).map((item) => <button className={channel === item ? 'active' : ''} key={item} onClick={() => setChannel(item)}>{item}</button>)}</div><ChannelPanel channel={channel} events={events} /><form onSubmit={sendAction}><label htmlFor="content">Your action</label><input id="content" name="content" required placeholder={channel === 'chat' ? 'Write a message' : 'Describe your action'} /><button disabled={action.isPending || execution.status === 'completed'}>Send action</button></form></div><aside><h2>Execution</h2><p>Status: {execution.status}</p><p>Current node: {execution.current_node_id ?? 'completed'}</p>{aiResult && <div className="dummy-ai"><strong>Dummy AI</strong><p>{aiResult.content ?? `${aiResult.label} (${aiResult.score ?? 0})`}</p></div>}<button onClick={() => complete.mutate()} disabled={!['running', 'waiting'].includes(execution.status)}>Complete simulation</button>{execution.status === 'completed' && <><h2>Completion summary</h2><p>Simulation completed for {execution.participant_id}. {events.length} {channel} event(s) recorded.</p><button onClick={restart}>Restart</button></>}<h2>Timeline</h2>{timeline.isPending && <LoadingState />}{timeline.data?.map((event) => <details key={event.event_id}><summary>{event.event_type}</summary><pre>{JSON.stringify(event.payload, null, 2)}</pre></details>)}</aside></section>}</main>
}

function ChannelPanel({ channel, events }: { channel: Channel; events: ChannelEvent[] }) {
  if (channel === 'document') return <div className="channel-panel"><h2>Shared document</h2>{events.length ? events.map((event, index) => <p key={index}>{event.content}</p>) : <p>No document events yet.</p>}</div>
  if (channel === 'call') return <div className="channel-panel"><h2>Call session</h2>{events.length ? events.map((event, index) => <p key={index}><strong>{event.actor}:</strong> {event.content}</p>) : <p>Waiting for call events.</p>}</div>
  if (channel === 'email') return <div className="channel-panel"><h2>Email inbox</h2>{events.length ? events.map((event, index) => <article className="email" key={index}><strong>{event.actor === 'system' ? 'Simulation' : 'You'}</strong><p>{event.content}</p></article>) : <p>No email messages yet.</p>}</div>
  return <div className="channel-panel"><h2>Chat conversation</h2>{events.length ? events.map((event, index) => <p className={`message ${event.actor}`} key={index}>{event.content}</p>) : <p>Start by sending a message, or wait for the workflow response.</p>}</div>
}
