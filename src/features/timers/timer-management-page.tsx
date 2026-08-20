import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../components/ui/dialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, CheckCircle2, Clock, Play, RefreshCw, Timer, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  cancelTimer,
  getTimers,
  rescheduleTimer,
  runTimerNow,
  type WorkflowTimer,
} from '../../shared/api/timers'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import { DataTable, type DataTableColumn } from '../../shared/components/data-table'
import { StatusBadge } from '../../shared/components/status-badge'
import { inputClass } from '../../shared/form-classes'

const TIMER_STATUSES = ['scheduled', 'running', 'retry', 'completed', 'failed']

const JAKARTA = 'Asia/Jakarta'
function parseServerTime(value: string) {
  return /(?:[zZ]$|[+-]\d{2}:?\d{2}$)/.test(value) ? new Date(value) : new Date(`${value}Z`)
}
function formatTime(value: string) {
  return parseServerTime(value).toLocaleString([], { timeZone: JAKARTA })
}
function toJakartaInput(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(parseServerTime(value))
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${pick('year')}-${pick('month')}-${pick('day')}T${pick('hour')}:${pick('minute')}`
}
function fromJakartaInput(value: string) {
  return new Date(`${value}:00+07:00`).toISOString()
}
function formatClock(value: number) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
function canManage(timer: WorkflowTimer) {
  return timer.status === 'scheduled' || timer.status === 'retry' || timer.status === 'cancelled'
}
function isPending(timer: WorkflowTimer) {
  return timer.status === 'scheduled' || timer.status === 'retry'
}
function countdown(value: string, now: number) {
  const total = Math.max(0, Math.floor((parseServerTime(value).getTime() - now) / 1000))
  return {
    total,
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}
function countdownLabel(parts: { total: number }) {
  return `${parts.total}s`
}
function durationSeconds(from: string, to: string) {
  return Math.round((parseServerTime(to).getTime() - parseServerTime(from).getTime()) / 1000)
}
function formatCancelDelta(dueAt: string, cancelledAt: string) {
  const seconds = durationSeconds(cancelledAt, dueAt)
  return seconds > 0
    ? `${seconds}s before due`
    : seconds < 0
      ? `${Math.abs(seconds)}s after due`
      : 'at due'
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function formatConfigurationScalar(value: unknown) {
  if (value === null) return 'None'
  if (value === undefined) return 'Not available'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}
function ConfigurationValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return value.length ? (
      <ul className="grid gap-1.5">
        {value.map((item, index) => (
          <li key={index} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-400">{index}</span>
            <ConfigurationValue value={item} />
          </li>
        ))}
      </ul>
    ) : (
      <span className="text-xs text-slate-400">No items</span>
    )
  }
  if (isRecord(value)) {
    return Object.keys(value).length ? (
      <dl className="grid gap-2">
        {Object.entries(value).map(([key, nestedValue]) => (
          <div key={key} className="grid gap-1 sm:grid-cols-[minmax(120px,0.35fr)_1fr] sm:gap-3">
            <dt className="break-words text-xs font-semibold text-slate-500">{key}</dt>
            <dd className="min-w-0 break-words text-xs text-slate-700">
              <ConfigurationValue value={nestedValue} />
            </dd>
          </div>
        ))}
      </dl>
    ) : (
      <span className="text-xs text-slate-400">No fields</span>
    )
  }
  return <span className="text-xs text-slate-700">{formatConfigurationScalar(value)}</span>
}
function progress(timer: WorkflowTimer, now: number) {
  const start = parseServerTime(timer.created_date).getTime()
  const due = parseServerTime(timer.due_at).getTime()
  return Math.min(100, Math.max(0, ((now - start) / Math.max(1, due - start)) * 100))
}

const STATUS_TONES: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-600',
  running: 'bg-indigo-50 text-indigo-600',
  retry: 'bg-amber-50 text-amber-600',
  completed: 'bg-emerald-50 text-emerald-600',
  failed: 'bg-red-50 text-red-600',
  total: 'bg-purple-50 text-[#5b46c5]',
}

function StatusIcon({ status }: { status: string }) {
  return status === 'failed' ? (
    <XCircle size={18} />
  ) : status === 'completed' ? (
    <CheckCircle2 size={18} />
  ) : status === 'retry' ? (
    <RefreshCw size={18} />
  ) : status === 'total' ? (
    <Timer size={18} />
  ) : (
    <CalendarClock size={18} />
  )
}

function CountdownCell({ timer, now }: { timer: WorkflowTimer; now: number }) {
  const parts = countdown(timer.due_at, now)
  const tone =
    parts.total <= 60 ? 'text-red-600' : parts.total <= 300 ? 'text-amber-600' : 'text-[#5b46c5]'
  return (
    <div className="min-w-[110px]">
      <strong className={`text-sm font-bold tabular-nums ${tone}`}>{countdownLabel(parts)}</strong>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <i
          className="block h-full rounded-full bg-gradient-to-r from-[#7c6ae6] to-[#4f46e5]"
          style={{ width: `${progress(timer, now)}%` }}
        />
      </div>
    </div>
  )
}

function StatCard({ status, count }: { status: string; count: number }) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${STATUS_TONES[status] ?? STATUS_TONES.total}`}
      >
        <StatusIcon status={status} />
      </span>
      <div className="min-w-0">
        <small className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          {status === 'total' ? 'All timers' : status}
        </small>
        <strong className="block text-xl leading-tight font-bold text-slate-900 tabular-nums">
          {count}
        </strong>
      </div>
    </article>
  )
}

export function TimerManagementPage() {
  const client = useQueryClient()
  const [now, setNow] = useState(Date.now())
  const [rescheduleTarget, setRescheduleTarget] = useState<WorkflowTimer | null>(null)
  const [cancelTarget, setCancelTarget] = useState<WorkflowTimer | null>(null)
  const [runNowTarget, setRunNowTarget] = useState<WorkflowTimer | null>(null)
  const [detailTarget, setDetailTarget] = useState<WorkflowTimer | null>(null)
  const timers = useQuery({ queryKey: ['timers'], queryFn: getTimers, refetchInterval: 5_000 })
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [])
  const refresh = () => client.invalidateQueries({ queryKey: ['timers'] })
  const cancel = useMutation({
    mutationFn: cancelTimer,
    onSuccess: () => {
      refresh()
      setCancelTarget(null)
      toast.success('Timer cancelled.')
    },
    onError: () => toast.error('Unable to cancel timer.'),
  })
  const reschedule = useMutation({
    mutationFn: ({ id, dueAt }: { id: string; dueAt: string }) => rescheduleTimer(id, dueAt),
    onSuccess: () => {
      refresh()
      setRescheduleTarget(null)
      toast.success('Timer rescheduled.')
    },
    onError: () => toast.error('Unable to reschedule timer.'),
  })
  const runNow = useMutation({
    mutationFn: runTimerNow,
    onSuccess: () => {
      refresh()
      setRunNowTarget(null)
      toast.success('Timer queued to run now.')
    },
    onError: () => toast.error('Unable to run timer now.'),
  })
  const rows = (timers.data ?? []).map((timer) => ({ ...timer, id: timer.timer_id }))
  const counts = useMemo(
    () => [
      ...TIMER_STATUSES.map((status) => ({
        status,
        count: rows.filter((timer) => timer.status === status).length,
      })),
      { status: 'total', count: rows.length },
    ],
    [rows],
  )
  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    {
      id: 'status',
      header: 'Status',
      cell: (timer) => <StatusBadge status={timer.status} />,
      sortValue: (timer) => timer.status,
    },
    {
      id: 'countdown',
      header: 'Countdown',
      cell: (timer) =>
        isPending(timer) ? (
          <CountdownCell timer={timer} now={now} />
        ) : (
          <span className="text-slate-300">—</span>
        ),
      sortValue: (timer) => timer.due_at,
    },
    {
      id: 'due',
      header: 'Due at',
      cell: (timer) => (
        <time className="text-xs text-slate-700 tabular-nums" dateTime={timer.due_at}>
          {formatTime(timer.due_at)}
        </time>
      ),
      sortValue: (timer) => timer.due_at,
    },
    {
      id: 'timeout',
      header: 'Timeout',
      cell: (timer) => (
        <span className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 tabular-nums">
          {durationSeconds(timer.created_date, timer.due_at)}s
        </span>
      ),
      sortValue: (timer) => timer.due_at,
    },
    {
      id: 'cancel',
      header: 'Cancel at',
      cell: (timer) =>
        timer.cancelled_at ? (
          <div className="flex flex-col gap-0.5">
            <time className="text-xs text-slate-700 tabular-nums" dateTime={timer.cancelled_at}>
              {formatTime(timer.cancelled_at)}
            </time>
            <span className="text-[10px] font-semibold text-slate-400">
              {formatCancelDelta(timer.due_at, timer.cancelled_at)}
            </span>
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        ),
      sortValue: (timer) => timer.cancelled_at ?? '',
    },
    {
      id: 'retries',
      header: 'Retries',
      cell: (timer) => (
        <span className="text-xs text-slate-600 tabular-nums">
          {timer.attempt_count} / {timer.max_attempts}
        </span>
      ),
      sortValue: (timer) => timer.attempt_count,
    },
    {
      id: 'delay',
      header: 'Retry delay',
      cell: (timer) => (
        <span className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 tabular-nums">
          {timer.retry_delay_seconds}s
        </span>
      ),
      sortValue: (timer) => timer.retry_delay_seconds,
    },
    {
      id: 'node',
      header: 'Node',
      cell: (timer) => (
        <div className="min-w-[150px]">
          <span className="block truncate text-xs font-semibold text-slate-700" title={timer.node_name ?? undefined}>
            {timer.node_name ?? 'Node unavailable'}
          </span>
          <span className="block truncate font-mono text-[10px] text-slate-400" title={timer.node_type ?? undefined}>
            {timer.node_type ?? 'Unknown type'}
          </span>
        </div>
      ),
      filterValue: (timer) => `${timer.node_name ?? ''} ${timer.node_type ?? ''}`,
    },
    {
      id: 'participant',
      header: 'Participant ID',
      cell: (timer) => <span className="font-mono text-xs text-slate-600">{timer.participant_id ?? 'Unavailable'}</span>,
      filterValue: (timer) => timer.participant_id ?? '',
    },
    {
      id: 'workflow',
      header: 'Workflow',
      cell: (timer) => (
        <span className="block max-w-[180px] truncate text-xs text-slate-700">{timer.workflow_name ?? 'Unavailable'}</span>
      ),
      filterValue: (timer) => timer.workflow_name ?? '',
    },
    {
      id: 'version',
      header: 'Version',
      cell: (timer) => <span className="text-xs text-slate-600">{timer.workflow_version ? `v${timer.workflow_version}` : 'Unavailable'}</span>,
      sortValue: (timer) => timer.workflow_version ?? -1,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (timer) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDetailTarget(timer)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-none transition hover:bg-slate-50"
          >
            Details
          </button>
          {canManage(timer) && (
            <>
              {isPending(timer) && (
                <button
                  onClick={() => setRunNowTarget(timer)}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700 shadow-none transition hover:bg-emerald-50"
                >
                  <Play size={11} fill="currentColor" />
                  Run now
                </button>
              )}
              <button
                disabled={timer.status === 'cancelled'}
                onClick={() => setCancelTarget(timer)}
                className="rounded-lg border border-red-200 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 shadow-none transition hover:bg-red-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setRescheduleTarget(timer)}
                className="rounded-lg bg-[#5b46c5] px-2 py-1 text-[11px] font-semibold text-white shadow-none transition hover:bg-[#4b38ac]"
              >
                Reschedule
              </button>
            </>
          )}
        </div>
      ),
    },
  ]
  return (
    <main className="timer-management-page min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-sm">
            <Clock size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-purple-700 uppercase">
              Scheduler observability
            </p>
            <h1 className="truncate text-lg font-bold text-slate-900">Timer management</h1>
            <p className="truncate text-xs text-slate-500">
              Timers refresh automatically while countdowns update in real time.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#5b46c5] shadow-sm">
            <Clock size={15} />
          </span>
          <div>
            <small className="block text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
              Current time (WIB)
            </small>
            <strong className="block text-sm text-slate-800 tabular-nums">
              {formatClock(now)}
            </strong>
          </div>
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {counts.map(({ status, count }) => (
          <StatCard key={status} status={status} count={count} />
        ))}
      </section>

      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {timers.isPending ? (
          <LoadingState />
        ) : timers.isError ? (
          <ErrorState message="Unable to load timers." />
        ) : (
          <DataTable rows={rows} columns={columns} selectable={false} />
        )}
      </section>

      <RescheduleDialog
        timer={rescheduleTarget}
        isSaving={reschedule.isPending}
        onClose={() => setRescheduleTarget(null)}
        onSave={(dueAt) =>
          rescheduleTarget && reschedule.mutate({ id: rescheduleTarget.timer_id, dueAt })
        }
      />
      <CancelDialog
        timer={cancelTarget}
        isSaving={cancel.isPending}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && cancel.mutate(cancelTarget.timer_id)}
      />
      <RunNowDialog
        timer={runNowTarget}
        isSaving={runNow.isPending}
        onClose={() => setRunNowTarget(null)}
        onConfirm={() => runNowTarget && runNow.mutate(runNowTarget.timer_id)}
      />
      <TimerDetail timer={detailTarget} onClose={() => setDetailTarget(null)} />
    </main>
  )
}

function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex justify-end gap-2">{children}</div>
}

function DialogButton({
  children,
  onClick,
  disabled,
  variant = 'ghost',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'ghost' | 'danger' | 'primary'
}) {
  const styles =
    variant === 'primary'
      ? 'border-transparent bg-[#5b46c5] text-white hover:bg-[#4b38ac]'
      : variant === 'danger'
        ? 'border-red-200 text-red-600 hover:bg-red-50'
        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3.5 py-2 text-xs font-semibold shadow-none transition disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  )
}

function RescheduleDialog({
  timer,
  isSaving,
  onClose,
  onSave,
}: {
  timer: WorkflowTimer | null
  isSaving: boolean
  onClose: () => void
  onSave: (dueAt: string) => void
}) {
  const [dueAt, setDueAt] = useState('')
  useEffect(() => setDueAt(timer ? toJakartaInput(timer.due_at) : ''), [timer])
  return (
    <Dialog open={Boolean(timer)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:max-w-[430px]">
        <DialogTitle className="text-base font-bold text-slate-900">Reschedule timer</DialogTitle>
        <DialogDescription>
          Choose a new date and time for this workflow action. Shown in Jakarta time (GMT+7).
        </DialogDescription>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
          New execution time
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
            className={inputClass}
          />
        </label>
        <DialogFooter>
          <DialogButton onClick={onClose}>Cancel</DialogButton>
          <DialogButton
            variant="primary"
            onClick={() => onSave(fromJakartaInput(dueAt))}
            disabled={!dueAt || isSaving}
          >
            Save schedule
          </DialogButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CancelDialog({
  timer,
  isSaving,
  onClose,
  onConfirm,
}: {
  timer: WorkflowTimer | null
  isSaving: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={Boolean(timer)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:max-w-[430px]">
        <DialogTitle className="text-base font-bold text-slate-900">
          Cancel scheduled timer?
        </DialogTitle>
        <DialogDescription>
          This prevents the workflow action from running at{' '}
          {timer ? formatTime(timer.due_at) : 'the scheduled time'}.
        </DialogDescription>
        <DialogFooter>
          <DialogButton onClick={onClose}>Keep timer</DialogButton>
          <DialogButton variant="danger" onClick={onConfirm} disabled={isSaving}>
            Cancel timer
          </DialogButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RunNowDialog({
  timer,
  isSaving,
  onClose,
  onConfirm,
}: {
  timer: WorkflowTimer | null
  isSaving: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={Boolean(timer)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:max-w-[430px]">
        <DialogTitle className="text-base font-bold text-slate-900">Run timer now?</DialogTitle>
        <DialogDescription>
          This immediately processes the timer event and continues the workflow through its configured path.
        </DialogDescription>
        <DialogFooter>
          <DialogButton onClick={onClose}>Keep schedule</DialogButton>
          <DialogButton variant="primary" onClick={onConfirm} disabled={isSaving}>
            Run now
          </DialogButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TimerDetail({ timer, onClose }: { timer: WorkflowTimer | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(timer)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:max-w-[480px]">
        <DialogTitle className="text-base font-bold text-slate-900">Timer details</DialogTitle>
        <DialogDescription>Retry and error context for this scheduled action.</DialogDescription>
        <dl className="mt-4 grid gap-3">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
            <dt className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Status
            </dt>
            <dd>
              <StatusBadge status={timer?.status ?? 'default'} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
            <dt className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Retry policy
            </dt>
            <dd className="text-xs font-semibold text-slate-700 tabular-nums">
              {timer?.attempt_count ?? 0} of {timer?.max_attempts ?? 0} attempts ·{' '}
              {timer?.retry_delay_seconds ?? 0}s delay
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
            <dt className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Last error
            </dt>
            <dd className="max-w-[260px] text-right text-xs text-slate-600">
              {timer?.last_error ?? 'No error recorded.'}
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Execution / node
            </dt>
            <dd className="grid gap-1 font-mono text-xs text-slate-600">
              <span>Execution: {timer?.execution_id ?? 'Unavailable'}</span>
              <span>Node execution: {timer?.node_execution_id ?? 'Unavailable'}</span>
              <span>
                Node: {timer?.node_name ?? 'Unavailable'} ({timer?.node_type ?? 'Unknown type'})
              </span>
            </dd>
          </div>
          <div className="grid gap-2 border-t border-slate-100 pt-3">
            <dt className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Node configuration</dt>
            <dd className="rounded-lg bg-slate-50 p-3">
              <ConfigurationValue value={timer?.node_configuration} />
            </dd>
          </div>
        </dl>
        <DialogFooter>
          <DialogButton onClick={onClose}>Close details</DialogButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
