import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getExecutions, getTimeline } from '../../shared/api/executions'
import { getSessionsForParticipant, type SimulationSession } from '../../shared/api/sessions'
import { getWorkflowVersion } from '../../shared/api/workflows'
import { LoadingState } from '../../shared/components/async-state'

export function ParticipantHistoryPage() {
  const [participantId, setParticipantId] = useState(''); const [searchId, setSearchId] = useState(''); const [session, setSession] = useState<SimulationSession | null>(null)
  const sessions = useQuery({ queryKey: ['participant-sessions', searchId], queryFn: () => getSessionsForParticipant(searchId), enabled: Boolean(searchId) })
  const workflow = useQuery({ queryKey: ['history-workflow', session?.workflow_version_id], queryFn: () => getWorkflowVersion(session!.workflow_version_id), enabled: Boolean(session) })
  const executions = useQuery({ queryKey: ['history-executions', session?.workflow_version_id], queryFn: () => getExecutions(session!.workflow_version_id), enabled: Boolean(session) })
  const execution = executions.data?.find((item) => item.session_id === session?.session_id)
  const timeline = useQuery({ queryKey: ['history-timeline', execution?.execution_id], queryFn: () => getTimeline(execution!.execution_id), enabled: Boolean(execution) })
  function search(event: FormEvent) { event.preventDefault(); setSearchId(participantId); setSession(null) }
  return <main className="history-page"><header><div><h1>Participant History</h1><p>Inspect workflow progress and channel activity by participant ID.</p></div><Link to="/studio">Open Studio</Link></header><form className="inline-form" onSubmit={search}><input required placeholder="Participant ID" value={participantId} onChange={(event) => setParticipantId(event.target.value)} /><button>Search history</button></form>{sessions.isPending && <LoadingState />}{searchId && sessions.data?.length === 0 && <p>No sessions found for this participant.</p>}<section className="history-layout">{sessions.data && <aside><h2>Sessions</h2>{sessions.data.map((item) => <button className={`workflow-item ${session?.session_id === item.session_id ? 'selected' : ''}`} key={item.session_id} onClick={() => setSession(item)}>{item.status}<small>{new Date(item.created_at).toLocaleString()}</small><small>{item.session_id}</small></button>)}</aside>}{session && <section><h2>Master flow</h2><p><strong>{workflow.data?.workflow_name ?? 'Loading workflow…'}</strong> · Version {workflow.data?.version_number ?? '—'}</p><p>Participant: {session.participant_id} · Current status: {session.status}</p><h2>Participant path</h2>{execution ? <><p>Current node/state: {execution.current_node_id ?? 'completed'}</p>{timeline.data?.map((event) => <details key={event.event_id}><summary>{event.event_type} · {new Date(event.created_at).toLocaleString()}</summary><p>Node: {event.node_id ?? '—'}</p><pre>{JSON.stringify(event.payload, null, 2)}</pre></details>)}</> : <p>Execution record is loading.</p>}<h2>Channel activity</h2>{(['chat_inbox', 'email_inbox', 'document_state', 'call_state'] as const).map((key) => <details key={key}><summary>{key.replace('_', ' ')}</summary><pre>{JSON.stringify(session[key], null, 2)}</pre></details>)}</section>}</section></main>
}
