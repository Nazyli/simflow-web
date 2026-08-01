import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { BellRing, CheckCircle2, CircleAlert, Clock3, FileText, Mail, MessageSquare, Phone, Route, Search, Timer, Workflow } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getExecutions, getTimeline, type ExecutionEvent } from '../../shared/api/executions'
import { getSessionsForParticipant, type SimulationSession } from '../../shared/api/sessions'
import { getWorkflowVersion } from '../../shared/api/workflows'
import { LoadingState } from '../../shared/components/async-state'
import { StatusBadge } from '../../shared/components/status-badge'
import { inputClass, selectClass } from '../../shared/form-classes'
import { ParticipantFlowView } from './participant-flow-view'

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

const EVENT_TONES: Record<string, string> = {
  failed: 'bg-red-50 text-red-600',
  completed: 'bg-emerald-50 text-emerald-600',
  waiting: 'bg-amber-50 text-amber-600',
  timer: 'bg-sky-50 text-sky-600',
  email: 'bg-indigo-50 text-indigo-600',
  chat: 'bg-indigo-50 text-indigo-600',
  call: 'bg-indigo-50 text-indigo-600',
  document: 'bg-indigo-50 text-indigo-600',
  trigger: 'bg-purple-50 text-purple-600',
}

export function ParticipantHistoryPage() {
  const [participantId, setParticipantId] = useState('')
  const [searchId, setSearchId] = useState('')
  const [status, setStatus] = useState('all')
  const [date, setDate] = useState('')
  const [session, setSession] = useState<SimulationSession | null>(null)
  const [event, setEvent] = useState<ExecutionEvent | null>(null)
  const [flowOpen, setFlowOpen] = useState(false)
  const sessions = useQuery({ queryKey: ['participant-sessions', searchId], queryFn: () => getSessionsForParticipant(searchId), enabled: Boolean(searchId) })
  const [searchParams] = useSearchParams()
  const [preselectedSessionId, setPreselectedSessionId] = useState<string | null>(null)
  useEffect(() => {
    const participant = searchParams.get('participant')
    const sessionId = searchParams.get('session')
    if (participant) { setParticipantId(participant); setSearchId(participant) }
    if (sessionId) setPreselectedSessionId(sessionId)
  }, [searchParams])
  useEffect(() => {
    if (!preselectedSessionId || !sessions.data) return
    const match = sessions.data.find((item) => item.session_id === preselectedSessionId)
    if (match) { setSession(match); setPreselectedSessionId(null) }
  }, [preselectedSessionId, sessions.data])
  const workflow = useQuery({ queryKey: ['history-workflow', session?.workflow_version_id], queryFn: () => getWorkflowVersion(session!.workflow_version_id), enabled: Boolean(session) })
  const executions = useQuery({ queryKey: ['history-executions', session?.workflow_version_id], queryFn: () => getExecutions(session!.workflow_version_id), enabled: Boolean(session) })
  const execution = executions.data?.find((item) => item.session_id === session?.session_id)
  const timeline = useQuery({ queryKey: ['history-timeline', execution?.execution_id], queryFn: () => getTimeline(execution!.execution_id), enabled: Boolean(execution) })
  const filteredSessions = useMemo(() => (sessions.data ?? []).filter((item) => (status === 'all' || item.status === status) && (!date || item.created_at.startsWith(date))), [date, sessions.data, status])
  function search(event: FormEvent) { event.preventDefault(); setSearchId(participantId); setSession(null) }
  const progress = execution ? Math.min(100, Math.max(12, (timeline.data?.length ?? 0) * 18)) : 0
  return (
    <main className="history-page min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-sm"><Workflow size={18} /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Observability</p>
            <h1 className="truncate text-lg font-bold text-slate-900">Investigate every simulation path</h1>
            <p className="truncate text-xs text-slate-500">Filter sessions, inspect the latest state, and trace event-level decisions.</p>
          </div>
        </div>
      </header>

      <form className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_.8fr_.8fr_auto]" onSubmit={search}>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Participant<input required placeholder="Participant ID" className={inputClass} value={participantId} onChange={(item) => setParticipantId(item.target.value)} /></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Workflow<input placeholder="All workflows" disabled className={`${inputClass} opacity-60`} /></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Status<select className={selectClass} value={status} onChange={(item) => setStatus(item.target.value)}><option value="all">All statuses</option><option value="waiting">Waiting</option><option value="running">Running</option><option value="failed">Failed</option><option value="completed">Completed</option></select></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Date<input type="date" className={inputClass} value={date} onChange={(item) => setDate(item.target.value)} /></label>
        <button type="submit" className="inline-flex h-9 items-center justify-center gap-1.5 self-end rounded-lg bg-[#5b46c5] px-3.5 py-2 text-xs font-semibold text-white shadow-none transition hover:bg-[#4b38ac]"><Search size={14} /> Search history</button>
      </form>

      {sessions.isPending && <LoadingState />}
      {searchId && filteredSessions.length === 0 && <p className="mt-3 text-xs text-slate-500">No sessions match these filters.</p>}

      <section className="mt-4 grid items-start gap-4 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Sessions <small className="ml-1 font-normal normal-case text-slate-400">{filteredSessions.length}</small></h2>
          <div className="divide-y divide-slate-100">
            {filteredSessions.map((item) => (
              <button key={item.session_id} className={`block w-full px-4 py-3.5 text-left transition ${session?.session_id === item.session_id ? 'bg-purple-50' : 'hover:bg-slate-50'}`} onClick={() => setSession(item)}>
                <div className="flex items-center justify-between gap-2"><StatusBadge status={item.status} /><time className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleString()}</time></div>
                <strong className="mt-1.5 block truncate font-mono text-xs font-semibold text-slate-700">{item.participant_id}</strong>
                <span className="mt-0.5 block text-[11px] text-slate-500">Last state: {item.status}</span>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100"><i className="block h-full rounded-full bg-gradient-to-r from-[#7c6ae6] to-[#4f46e5]" style={{ width: item.status === 'completed' ? '100%' : item.status === 'failed' ? '65%' : '42%' }} /></div>
              </button>
            ))}
          </div>
        </aside>

        {session && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-50 text-[#5b46c5]"><Workflow size={18} /></span>
                <div className="min-w-0">
                  <small className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Workflow / version</small>
                  <strong className="block truncate text-xs font-bold text-slate-800">{workflow.data?.workflow_name ?? 'Loading workflow…'} · v{workflow.data?.version_number ?? '—'}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={session.status} />
                <button type="button" disabled={!execution} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 shadow-none transition hover:border-[#5b46c5] hover:text-[#5b46c5] disabled:opacity-50" onClick={() => setFlowOpen(true)}>
                  <Route size={14} /> View flow
                </button>
              </div>
            </div>

            <div className="grid gap-4 border-b border-slate-100 px-5 py-4 sm:grid-cols-2">
              <div><small className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Current node</small><strong className="mt-1 block text-xs font-bold text-slate-800">{execution?.current_node_id ?? 'Completed'}</strong></div>
              <div><small className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Workflow journey</small><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><i className="block h-full rounded-full bg-gradient-to-r from-[#7c6ae6] to-[#4f46e5]" style={{ width: `${progress}%` }} /></div><span className="mt-1.5 block text-[10px] text-slate-400">{timeline.data?.length ?? 0} events recorded</span></div>
            </div>

            <div className="px-5 py-4">
              <h2 className="mb-2 text-sm font-bold text-slate-900">Event timeline</h2>
              {timeline.isPending && <LoadingState />}
              <div className="grid">{timeline.data?.map((item) => <TimelineEvent key={item.event_id} event={item} onOpen={() => setEvent(item)} />)}</div>
            </div>
          </section>
        )}
      </section>

      <EventDialog event={event} onClose={() => setEvent(null)} />
      <ParticipantFlowView open={flowOpen} onClose={() => setFlowOpen(false)} versionId={session?.workflow_version_id ?? ''} executionId={execution?.execution_id ?? ''} title={workflow.data ? `${workflow.data.workflow_name} · v${workflow.data.version_number}` : 'Participant flow'} currentState={execution?.current_node_id ?? null} />
    </main>
  )
}

function TimelineEvent({ event, onOpen }: { event: ExecutionEvent; onOpen: () => void }) {
  const appearance = eventAppearance(event.event_type)
  const Icon = appearance.icon
  return (
    <button className="group flex w-full items-center gap-3 border-b border-slate-100 py-2.5 text-left transition-all last:border-0 hover:pl-1.5" onClick={onOpen}>
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${EVENT_TONES[appearance.tone] ?? 'bg-slate-100 text-slate-500'}`}><Icon size={15} /></span>
      <div className="min-w-0">
        <strong className="block truncate text-xs font-bold capitalize text-slate-800">{event.event_type.replaceAll('_', ' ')}</strong>
        <span className="mt-0.5 block truncate text-[11px] text-slate-500">{event.node_id ?? 'Workflow event'} · {new Date(event.created_at).toLocaleString()}</span>
      </div>
      <span className="ml-auto text-[11px] font-semibold text-[#5b46c5]">Inspect</span>
    </button>
  )
}

function EventDialog({ event, onClose }: { event: ExecutionEvent | null; onClose: () => void }) {
  const [tab, setTab] = useState<'detail' | 'raw'>('detail')
  return (
    <Dialog open={Boolean(event)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] p-6">
        <DialogTitle className="text-base font-bold capitalize text-slate-900">{event?.event_type.replaceAll('_', ' ') ?? 'Event detail'}</DialogTitle>
        <DialogDescription>Timeline event inspection</DialogDescription>
        <div className="flex gap-1 border-b border-slate-100">
          <button className={`border-b-2 px-3 py-2 text-xs font-semibold transition ${tab === 'detail' ? 'border-[#5b46c5] text-[#5b46c5]' : 'border-transparent text-slate-500 hover:text-slate-700'}`} onClick={() => setTab('detail')}>Details</button>
          <button className={`border-b-2 px-3 py-2 text-xs font-semibold transition ${tab === 'raw' ? 'border-[#5b46c5] text-[#5b46c5]' : 'border-transparent text-slate-500 hover:text-slate-700'}`} onClick={() => setTab('raw')}>Raw payload</button>
        </div>
        {tab === 'detail' ? (
          <div className="grid gap-3">
            <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Node</p><p className="mt-0.5 text-xs text-slate-700">{event?.node_id ?? 'System'}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Recorded at</p><p className="mt-0.5 text-xs text-slate-700">{event ? new Date(event.created_at).toLocaleString() : '—'}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Payload fields</p><p className="mt-0.5 text-xs text-slate-700">{event ? Object.keys(event.payload).join(', ') || 'No structured fields' : '—'}</p></div>
          </div>
        ) : <pre className="max-h-[260px] overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-blue-100">{JSON.stringify(event?.payload ?? {}, null, 2)}</pre>}
        <div className="mt-5 flex justify-end">
          <DialogClose asChild><Button variant="outline" size="sm">Close</Button></DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
