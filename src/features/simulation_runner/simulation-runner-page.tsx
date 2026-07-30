import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type ComponentType, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { completeExecution, getTimeline, startExecution, submitExecutionAction } from '../../shared/api/executions'
import { getSession, type SessionChannelEvent, type SimulationSession } from '../../shared/api/sessions'
import { getPublishedVersions } from '../../shared/api/workflows'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import type { Execution } from '../../shared/types/workflow'

type Channel = 'chat' | 'email' | 'call' | 'document'
type ChannelPanelProps = { events: SessionChannelEvent[] }

const sessionEvents: Record<Channel, (session: SimulationSession) => SessionChannelEvent[]> = {
  email: (session) => session.email_inbox,
  chat: (session) => session.chat_inbox,
  call: (session) => session.call_state,
  document: (session) => session.document_state,
}

const channelPanelRenderers: Record<Channel, ComponentType<ChannelPanelProps>> = {
  email: EmailPanel,
  chat: ChatPanel,
  call: CallPanel,
  document: DocumentPanel,
}

export function SimulationRunnerPage() {
  const queryClient = useQueryClient()
  const [participantId, setParticipantId] = useState('')
  const [versionId, setVersionId] = useState('')
  const [channel, setChannel] = useState<Channel>('chat')
  const [execution, setExecution] = useState<Execution | null>(null)
  const versions = useQuery({ queryKey: ['published-versions'], queryFn: getPublishedVersions })
  const timeline = useQuery({ queryKey: ['timeline', execution?.execution_id], queryFn: () => getTimeline(execution!.execution_id), enabled: Boolean(execution) })
  const session = useQuery({ queryKey: ['session', execution?.session_id], queryFn: () => getSession(execution!.session_id!), enabled: Boolean(execution?.session_id), refetchInterval: execution?.status === 'running' || execution?.status === 'waiting' ? 3000 : false })
  const start = useMutation({ mutationFn: startExecution, onSuccess: (result) => { setExecution(result); queryClient.invalidateQueries({ queryKey: ['timeline', result.execution_id] }); queryClient.invalidateQueries({ queryKey: ['session', result.session_id] }) } })
  const action = useMutation({ mutationFn: ({ actionType, content }: { actionType: string; content: string }) => submitExecutionAction(execution!.execution_id, { action_type: actionType, payload: { content, channel } }), onSuccess: (result) => { setExecution(result); queryClient.invalidateQueries({ queryKey: ['timeline', result.execution_id] }); queryClient.invalidateQueries({ queryKey: ['session', result.session_id] }) } })
  const complete = useMutation({ mutationFn: () => completeExecution(execution!.execution_id), onSuccess: (result) => { setExecution(result); queryClient.invalidateQueries({ queryKey: ['session', result.session_id] }) } })
  const fallbackEvents = (execution?.context.channel_events as SessionChannelEvent[] | undefined)?.filter((event) => event.channel === channel) ?? []
  const events = session.data ? sessionEvents[channel](session.data) : fallbackEvents
  const aiResult = execution?.context.last_ai_result as { content?: string; label?: string; score?: number } | undefined
  const Panel = channelPanelRenderers[channel]

  function startSimulation(event: FormEvent<HTMLFormElement>) { event.preventDefault(); start.mutate({ workflow_version_id: versionId, participant_id: participantId, context: { channel } }) }
  function sendAction(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const content = String(new FormData(event.currentTarget).get('content')); action.mutate({ actionType: 'message', content }); event.currentTarget.reset() }
  function restart() { setExecution(null); setParticipantId(''); setVersionId('') }

  return <main><header><div><h1>Simulation Runner</h1><p>Run a published workflow for one participant.</p></div><Link to="/studio">Open Simulation Studio</Link></header>
    {!execution && <form className="runner-start" onSubmit={startSimulation}><label htmlFor="participant-id">Participant ID</label><input id="participant-id" required value={participantId} onChange={(event) => setParticipantId(event.target.value)} /><label htmlFor="workflow-version">Published workflow version</label><select id="workflow-version" required value={versionId} onChange={(event) => setVersionId(event.target.value)}><option value="">Select version</option>{versions.data?.map((version) => <option key={version.workflow_version_id} value={version.workflow_version_id}>Version {version.version_number} — {version.workflow_version_id}</option>)}</select><label htmlFor="channel">Channel</label><select id="channel" value={channel} onChange={(event) => setChannel(event.target.value as Channel)}>{(['chat', 'email', 'call', 'document'] as Channel[]).map((item) => <option key={item}>{item}</option>)}</select><button disabled={start.isPending || !versionId}>Start simulation</button>{versions.isPending && <LoadingState />}{start.isError && <ErrorState message="Unable to start the selected published workflow." />}</form>}
    {execution && <section className="runner"><div><div className="channel-tabs">{(['chat', 'email', 'call', 'document'] as Channel[]).map((item) => <button className={channel === item ? 'active' : ''} key={item} onClick={() => setChannel(item)}>{item}</button>)}</div>{session.isPending && <LoadingState />}<Panel events={events} /><form onSubmit={sendAction}><label htmlFor="content">Your action</label><input id="content" name="content" required placeholder={channel === 'chat' ? 'Write a message' : 'Describe your action'} /><button disabled={action.isPending || execution.status === 'completed'}>Send action</button></form></div><aside><h2>Execution</h2><p>Status: {execution.status}</p><p>Session: {execution.session_id}</p><p>Current node: {execution.current_node_id ?? 'completed'}</p>{aiResult && <div className="dummy-ai"><strong>Dummy AI</strong><p>{aiResult.content ?? `${aiResult.label} (${aiResult.score ?? 0})`}</p></div>}<button onClick={() => complete.mutate()} disabled={!['running', 'waiting'].includes(execution.status)}>Complete simulation</button>{execution.status === 'completed' && <><h2>Completion summary</h2><p>Simulation completed for {execution.participant_id}. {events.length} {channel} event(s) recorded.</p><button onClick={restart}>Restart</button></>}<h2>Timeline</h2>{timeline.isPending && <LoadingState />}{timeline.data?.map((event) => <details key={event.event_id}><summary>{event.event_type}</summary><pre>{JSON.stringify(event.payload, null, 2)}</pre></details>)}</aside></section>}</main>
}

function EmailPanel({ events }: ChannelPanelProps) {
  return <div className="channel-panel"><h2>Email inbox</h2>{events.length ? events.map((event, index) => <article className="email" key={index}><strong>{String(event.subject ?? event.action_type ?? 'Email')}</strong><dl><dt>From</dt><dd>{String(event.from ?? event.actor ?? '—')}</dd><dt>To</dt><dd>{String(event.to ?? '—')}</dd><dt>Status</dt><dd>{String(event.action_type ?? '—')}</dd><dt>Time</dt><dd>{formatTime(event.timestamp)}</dd></dl><p>{String(event.content ?? '')}</p></article>) : <p>No email messages yet.</p>}</div>
}

function ChatPanel({ events }: ChannelPanelProps) {
  return <div className="channel-panel"><h2>Chat conversation</h2>{events.length ? events.map((event, index) => <article className={`message ${String(event.actor ?? 'system')}`} key={index}><small>{String(event.chat_id ?? 'chat')} · {String(event.from ?? event.actor ?? '—')} · {formatTime(event.timestamp)}</small><p>{String(event.content ?? '')}</p></article>) : <p>Start by sending a message, or wait for the workflow response.</p>}</div>
}

function CallPanel({ events }: ChannelPanelProps) {
  const calls = useMemo(() => groupCalls(events), [events])
  return <div className="channel-panel"><h2>Call sessions</h2>{calls.length ? calls.map((call) => <article className="call-card" key={call.callId}><strong>{call.callId}</strong><dl><dt>Start</dt><dd>{formatTime(call.startTime)}</dd><dt>Finish</dt><dd>{formatTime(call.finishTime)}</dd><dt>Duration</dt><dd>{formatDuration(call.startTime, call.finishTime)}</dd></dl></article>) : <p>Waiting for call events.</p>}</div>
}

function DocumentPanel({ events }: ChannelPanelProps) {
  return <div className="channel-panel"><h2>Shared documents</h2>{events.length ? events.map((event, index) => <article className="document-card" key={index}><strong>{String(event.document_name ?? event.document_id ?? 'Document')}</strong><dl><dt>Read only</dt><dd>{event.read_only ? 'Yes' : 'No'}</dd><dt>State</dt><dd>{String(event.state ?? event.action_type ?? '—')}</dd><dt>Time</dt><dd>{formatTime(event.timestamp)}</dd></dl></article>) : <p>No document events yet.</p>}</div>
}

function groupCalls(events: SessionChannelEvent[]) {
  const calls = new Map<string, { callId: string; startTime?: string; finishTime?: string }>()
  for (const event of events) {
    const callId = String(event.call_id ?? 'Unknown call')
    const call = calls.get(callId) ?? { callId }
    if (event.action_type === 'start_call') call.startTime = String(event.started_at ?? event.timestamp ?? '')
    if (event.action_type === 'finish_call') call.finishTime = String(event.finished_at ?? event.timestamp ?? '')
    calls.set(callId, call)
  }
  return [...calls.values()]
}

function formatTime(value: unknown) {
  if (typeof value !== 'string' || !value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString()
}

function formatDuration(start?: string, finish?: string) {
  if (!start || !finish) return 'In progress'
  const milliseconds = new Date(finish).valueOf() - new Date(start).valueOf()
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return '—'
  return `${Math.floor(milliseconds / 60000)}m ${Math.floor((milliseconds % 60000) / 1000)}s`
}
