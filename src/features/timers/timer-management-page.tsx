import * as Dialog from '@radix-ui/react-dialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, CheckCircle2, RefreshCw, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { cancelTimer, getTimers, rescheduleTimer, type WorkflowTimer } from '../../shared/api/timers'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import { DataTable, type DataTableColumn } from '../../shared/components/data-table'
import { StatusBadge } from '../../shared/components/status-badge'

function formatTime(value: string) { return new Date(value).toLocaleString() }
function canManage(timer: WorkflowTimer) { return timer.status === 'scheduled' || timer.status === 'retry' || timer.status === 'cancelled' }
function countdown(value: string, now: number) { const seconds = Math.max(0, Math.floor((new Date(value).getTime() - now) / 1000)); const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); return `${hours}h ${minutes.toString().padStart(2, '0')}m` }

export function TimerManagementPage() {
  const client = useQueryClient()
  const [now, setNow] = useState(Date.now())
  const [rescheduleTarget, setRescheduleTarget] = useState<WorkflowTimer | null>(null)
  const [cancelTarget, setCancelTarget] = useState<WorkflowTimer | null>(null)
  const [detailTarget, setDetailTarget] = useState<WorkflowTimer | null>(null)
  const timers = useQuery({ queryKey: ['timers'], queryFn: getTimers, refetchInterval: 5_000 })
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer) }, [])
  const refresh = () => client.invalidateQueries({ queryKey: ['timers'] })
  const cancel = useMutation({ mutationFn: cancelTimer, onSuccess: () => { refresh(); setCancelTarget(null); toast.success('Timer cancelled.') }, onError: () => toast.error('Unable to cancel timer.') })
  const reschedule = useMutation({ mutationFn: ({ id, dueAt }: { id: string; dueAt: string }) => rescheduleTimer(id, dueAt), onSuccess: () => { refresh(); setRescheduleTarget(null); toast.success('Timer rescheduled.') }, onError: () => toast.error('Unable to reschedule timer.') })
  const rows = (timers.data ?? []).map((timer) => ({ ...timer, id: timer.timer_id }))
  const counts = useMemo(() => ['scheduled', 'running', 'retry', 'completed', 'failed'].map((status) => ({ status, count: rows.filter((timer) => timer.status === status).length })), [rows])
  const columns: DataTableColumn<typeof rows[number]>[] = [
    { id: 'status', header: 'Status', cell: (timer) => <StatusBadge status={timer.status} />, sortValue: (timer) => timer.status },
    { id: 'countdown', header: 'Countdown', cell: (timer) => timer.status === 'scheduled' || timer.status === 'retry' ? <strong className="timer-countdown">{countdown(timer.due_at, now)}</strong> : '—', sortValue: (timer) => timer.due_at },
    { id: 'due', header: 'Execution time', cell: (timer) => <time dateTime={timer.due_at}>{formatTime(timer.due_at)}</time>, sortValue: (timer) => timer.due_at },
    { id: 'retries', header: 'Retries', cell: (timer) => `${timer.attempt_count} / ${timer.max_attempts}`, sortValue: (timer) => timer.attempt_count },
    { id: 'node', header: 'Node', cell: (timer) => timer.node_id, filterValue: (timer) => timer.node_id },
    { id: 'actions', header: 'Actions', cell: (timer) => <div className="timer-actions"><button onClick={() => setDetailTarget(timer)}>Details</button>{canManage(timer) && <><button disabled={timer.status === 'cancelled'} onClick={() => setCancelTarget(timer)}>Cancel</button><button onClick={() => setRescheduleTarget(timer)}>Reschedule</button></>}</div> },
  ]
  return <main className="timer-management"><header><div><p className="eyebrow">Scheduler observability</p><h1>Timer management</h1><p>Timers refresh automatically while countdowns update in real time.</p></div></header><section className="timer-summary">{counts.map(({ status, count }) => <article key={status}><span className={`timer-summary-icon ${status}`}>{status === 'failed' ? <XCircle size={18} /> : status === 'completed' ? <CheckCircle2 size={18} /> : status === 'retry' ? <RefreshCw size={18} /> : <CalendarClock size={18} />}</span><div><small>{status}</small><strong>{count}</strong></div></article>)}</section>{timers.isPending ? <LoadingState /> : timers.isError ? <ErrorState message="Unable to load timers." /> : <DataTable rows={rows} columns={columns} />}<RescheduleDialog timer={rescheduleTarget} isSaving={reschedule.isPending} onClose={() => setRescheduleTarget(null)} onSave={(dueAt) => rescheduleTarget && reschedule.mutate({ id: rescheduleTarget.timer_id, dueAt })} /><CancelDialog timer={cancelTarget} isSaving={cancel.isPending} onClose={() => setCancelTarget(null)} onConfirm={() => cancelTarget && cancel.mutate(cancelTarget.timer_id)} /><TimerDetail timer={detailTarget} onClose={() => setDetailTarget(null)} /></main>
}

function RescheduleDialog({ timer, isSaving, onClose, onSave }: { timer: WorkflowTimer | null; isSaving: boolean; onClose: () => void; onSave: (dueAt: string) => void }) { const [dueAt, setDueAt] = useState(''); useEffect(() => setDueAt(timer ? timer.due_at.slice(0, 16) : ''), [timer]); return <Dialog.Root open={Boolean(timer)} onOpenChange={(open) => !open && onClose()}><Dialog.Portal><Dialog.Overlay className="command-overlay" /><Dialog.Content className="timer-dialog"><Dialog.Title>Reschedule timer</Dialog.Title><Dialog.Description>Choose a new date and time for this workflow action.</Dialog.Description><label>New execution time<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label><div><button onClick={() => onSave(new Date(dueAt).toISOString())} disabled={!dueAt || isSaving}>Save schedule</button><Dialog.Close asChild><button>Cancel</button></Dialog.Close></div></Dialog.Content></Dialog.Portal></Dialog.Root> }
function CancelDialog({ timer, isSaving, onClose, onConfirm }: { timer: WorkflowTimer | null; isSaving: boolean; onClose: () => void; onConfirm: () => void }) { return <Dialog.Root open={Boolean(timer)} onOpenChange={(open) => !open && onClose()}><Dialog.Portal><Dialog.Overlay className="command-overlay" /><Dialog.Content className="timer-dialog"><Dialog.Title>Cancel scheduled timer?</Dialog.Title><Dialog.Description>This prevents the workflow action from running at {timer ? formatTime(timer.due_at) : 'the scheduled time'}.</Dialog.Description><div><button className="danger" onClick={onConfirm} disabled={isSaving}>Cancel timer</button><Dialog.Close asChild><button>Keep timer</button></Dialog.Close></div></Dialog.Content></Dialog.Portal></Dialog.Root> }
function TimerDetail({ timer, onClose }: { timer: WorkflowTimer | null; onClose: () => void }) { return <Dialog.Root open={Boolean(timer)} onOpenChange={(open) => !open && onClose()}><Dialog.Portal><Dialog.Overlay className="command-overlay" /><Dialog.Content className="timer-sheet"><Dialog.Title>Timer details</Dialog.Title><Dialog.Description>Retry and error context for this scheduled action.</Dialog.Description><div><small>Status</small><StatusBadge status={timer?.status ?? 'default'} /></div><div><small>Retry policy</small><strong>{timer?.attempt_count ?? 0} of {timer?.max_attempts ?? 0} attempts · {timer?.retry_delay_seconds ?? 0}s delay</strong></div><div><small>Last error</small><p>{timer?.last_error ?? 'No error recorded.'}</p></div><div><small>Execution / node</small><strong>{timer?.execution_id} · {timer?.node_id}</strong></div><Dialog.Close asChild><button>Close details</button></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root> }
