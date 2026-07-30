import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { cancelTimer, getTimers, rescheduleTimer, type WorkflowTimer } from '../../shared/api/timers'
import { DataTable, type DataTableColumn } from '../../shared/components/data-table'
import { LoadingState } from '../../shared/components/async-state'

function formatTime(value: string) { return new Date(value).toLocaleString() }
function canManage(timer: WorkflowTimer) { return timer.status === 'scheduled' || timer.status === 'retry' || timer.status === 'cancelled' }

export function TimerManagementPage() {
  const client = useQueryClient()
  const timers = useQuery({ queryKey: ['timers'], queryFn: getTimers, refetchInterval: 5_000 })
  const refresh = () => client.invalidateQueries({ queryKey: ['timers'] })
  const cancel = useMutation({ mutationFn: cancelTimer, onSuccess: refresh })
  const reschedule = useMutation({ mutationFn: ({ id, dueAt }: { id: string; dueAt: string }) => rescheduleTimer(id, dueAt), onSuccess: refresh })
  function rescheduleTimerPrompt(timer: WorkflowTimer) { const value = window.prompt('New execution time (local date/time)', timer.due_at.slice(0, 16)); if (value) reschedule.mutate({ id: timer.timer_id, dueAt: new Date(value).toISOString() }) }
  const rows = (timers.data ?? []).map((timer) => ({ ...timer, id: timer.timer_id }))
  const columns: DataTableColumn<typeof rows[number]>[] = [
    { id: 'status', header: 'Status', cell: (timer) => <span className={`timer-status ${timer.status}`}>{timer.status}</span>, sortValue: (timer) => timer.status },
    { id: 'due', header: 'Execution time', cell: (timer) => <time dateTime={timer.due_at}>{formatTime(timer.due_at)}</time>, sortValue: (timer) => timer.due_at },
    { id: 'retries', header: 'Retries', cell: (timer) => `${timer.attempt_count} / ${timer.max_attempts}`, sortValue: (timer) => timer.attempt_count },
    { id: 'execution', header: 'Execution', cell: (timer) => timer.execution_id, filterValue: (timer) => timer.execution_id },
    { id: 'node', header: 'Node', cell: (timer) => timer.node_id, filterValue: (timer) => timer.node_id },
    { id: 'error', header: 'Last error', cell: (timer) => timer.last_error ?? '—', filterValue: (timer) => timer.last_error ?? '' },
    { id: 'actions', header: 'Actions', cell: (timer) => canManage(timer) ? <><button disabled={timer.status === 'cancelled' || cancel.isPending} onClick={() => cancel.mutate(timer.timer_id)}>Cancel</button><button disabled={reschedule.isPending} onClick={() => rescheduleTimerPrompt(timer)}>Reschedule</button></> : '—' },
  ]
  return <main className="timer-management"><header><div><h1>Timer management</h1><p>Refreshes automatically every five seconds.</p></div><Link to="/studio">Back to Studio</Link></header>{timers.isPending && <LoadingState />}{timers.isError && <p className="validation-errors">Unable to load timers.</p>}<DataTable rows={rows} columns={columns} /></main>
}
