import * as Dialog from '@radix-ui/react-dialog'
import { useQuery } from '@tanstack/react-query'
import { BellRing, CheckCircle2, CircleAlert, Clock3, FileText, Mail, MessageSquare, Phone, Timer, Workflow } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { getExecutions, getTimeline, type ExecutionEvent } from '../../shared/api/executions'
import { getSessionsForParticipant, type SimulationSession } from '../../shared/api/sessions'
import { getWorkflowVersion } from '../../shared/api/workflows'
import { LoadingState } from '../../shared/components/async-state'
import { StatusBadge } from '../../shared/components/status-badge'

const eventAppearance = (type: string) => {
  const value = type.toLowerCase()
  if (value.includes('fail')) return { icon: CircleAlert, tone: 'failed' }
  if (value.includes('complete')) return { icon: CheckCircle2, tone: 'completed' }
  if (value.includes('wait')) return { icon: Clock3, tone: 'waiting' }
  if (value.includes('timer')) return { icon: Timer, tone: 'timer' }
  if (value.includes('email')) return { icon: Mail, tone: 'email' }
  if (value.includes('chat')) return { icon: MessageSquare, tone: 'chat' }
  if (value.includes('call')) return { icon: Phone, tone: 'call' }
  if (value.includes('document')) return { icon: FileText, tone: 'document' }
  return { icon: BellRing, tone: 'trigger' }
}

export function ParticipantHistoryPage() {
  const [participantId, setParticipantId] = useState('')
  const [searchId, setSearchId] = useState('')
  const [status, setStatus] = useState('all')
  const [date, setDate] = useState('')
  const [session, setSession] = useState<SimulationSession | null>(null)
  const [event, setEvent] = useState<ExecutionEvent | null>(null)
  const sessions = useQuery({ queryKey: ['participant-sessions', searchId], queryFn: () => getSessionsForParticipant(searchId), enabled: Boolean(searchId) })
  const workflow = useQuery({ queryKey: ['history-workflow', session?.workflow_version_id], queryFn: () => getWorkflowVersion(session!.workflow_version_id), enabled: Boolean(session) })
  const executions = useQuery({ queryKey: ['history-executions', session?.workflow_version_id], queryFn: () => getExecutions(session!.workflow_version_id), enabled: Boolean(session) })
  const execution = executions.data?.find((item) => item.session_id === session?.session_id)
  const timeline = useQuery({ queryKey: ['history-timeline', execution?.execution_id], queryFn: () => getTimeline(execution!.execution_id), enabled: Boolean(execution) })
  const filteredSessions = useMemo(() => (sessions.data ?? []).filter((item) => (status === 'all' || item.status === status) && (!date || item.created_at.startsWith(date))), [date, sessions.data, status])
  function search(event: FormEvent) { event.preventDefault(); setSearchId(participantId); setSession(null) }
  const progress = execution ? Math.min(100, Math.max(12, (timeline.data?.length ?? 0) * 18)) : 0
  return <main className="history-page"><header><div><p className="eyebrow">Observability</p><h1>Investigate every simulation path</h1><p>Filter sessions, inspect the latest state, and trace event-level decisions.</p></div></header><form className="history-filters" onSubmit={search}><label>Participant<input required placeholder="Participant ID" value={participantId} onChange={(item) => setParticipantId(item.target.value)} /></label><label>Workflow<input placeholder="All workflows" disabled /></label><label>Status<select value={status} onChange={(item) => setStatus(item.target.value)}><option value="all">All statuses</option><option value="waiting">Waiting</option><option value="running">Running</option><option value="failed">Failed</option><option value="completed">Completed</option></select></label><label>Date<input type="date" value={date} onChange={(item) => setDate(item.target.value)} /></label><button>Search history</button></form>{sessions.isPending && <LoadingState />}{searchId && filteredSessions.length === 0 && <p>No sessions match these filters.</p>}<section className="history-layout investigation-layout"><aside><h2>Sessions <small>{filteredSessions.length}</small></h2>{filteredSessions.map((item) => <button className={`session-card ${session?.session_id === item.session_id ? 'selected' : ''}`} key={item.session_id} onClick={() => setSession(item)}><div><StatusBadge status={item.status} /><time>{new Date(item.created_at).toLocaleString()}</time></div><strong>{item.participant_id}</strong><span>Last state: {item.status}</span><div className="progress-track"><i style={{ width: item.status === 'completed' ? '100%' : item.status === 'failed' ? '65%' : '42%' }} /></div></button>)}</aside>{session && <section className="investigation-detail"><div className="investigation-summary"><div><span className="summary-icon"><Workflow size={18} /></span><div><small>Workflow / version</small><strong>{workflow.data?.workflow_name ?? 'Loading workflow…'} · v{workflow.data?.version_number ?? '—'}</strong></div></div><StatusBadge status={session.status} /></div><div className="state-summary"><div><small>Current node</small><strong>{execution?.current_node_id ?? 'Completed'}</strong></div><div><small>Workflow journey</small><div className="progress-track"><i style={{ width: `${progress}%` }} /></div><span>{timeline.data?.length ?? 0} events recorded</span></div></div><h2>Event timeline</h2>{timeline.isPending && <LoadingState />}<div className="event-timeline">{timeline.data?.map((item) => <TimelineEvent key={item.event_id} event={item} onOpen={() => setEvent(item)} />)}</div></section>}</section><EventDialog event={event} onClose={() => setEvent(null)} /></main>
}

function TimelineEvent({ event, onOpen }: { event: ExecutionEvent; onOpen: () => void }) { const appearance = eventAppearance(event.event_type); const Icon = appearance.icon; return <button className={`timeline-event ${appearance.tone}`} onClick={onOpen}><span className="timeline-icon"><Icon size={16} /></span><div><strong>{event.event_type.replaceAll('_', ' ')}</strong><span>{event.node_id ?? 'Workflow event'} · {new Date(event.created_at).toLocaleString()}</span></div><span className="timeline-open">Inspect</span></button> }

function EventDialog({ event, onClose }: { event: ExecutionEvent | null; onClose: () => void }) { const [tab, setTab] = useState<'detail' | 'raw'>('detail'); return <Dialog.Root open={Boolean(event)} onOpenChange={(open) => !open && onClose()}><Dialog.Portal><Dialog.Overlay className="command-overlay" /><Dialog.Content className="event-dialog"><Dialog.Title>{event?.event_type.replaceAll('_', ' ') ?? 'Event detail'}</Dialog.Title><Dialog.Description>Timeline event inspection</Dialog.Description><div className="event-tabs"><button className={tab === 'detail' ? 'active' : ''} onClick={() => setTab('detail')}>Details</button><button className={tab === 'raw' ? 'active' : ''} onClick={() => setTab('raw')}>Raw payload</button></div>{tab === 'detail' ? <div className="event-detail"><p><strong>Node</strong>{event?.node_id ?? 'System'}</p><p><strong>Recorded at</strong>{event ? new Date(event.created_at).toLocaleString() : '—'}</p><p><strong>Payload fields</strong>{event ? Object.keys(event.payload).join(', ') || 'No structured fields' : '—'}</p></div> : <pre className="raw-payload">{JSON.stringify(event?.payload ?? {}, null, 2)}</pre>}<Dialog.Close asChild><button className="dialog-close">Close</button></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root> }
