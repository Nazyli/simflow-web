import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { cancelTimer, getTimers, rescheduleTimer, type WorkflowTimer } from '../../shared/api/timers'
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
  return <main className="timer-management"><header><div><h1>Timer management</h1><p>Refreshes automatically every five seconds.</p></div><Link to="/studio">Back to Studio</Link></header>{timers.isPending && <LoadingState />}{timers.isError && <p className="validation-errors">Unable to load timers.</p>}<table><thead><tr><th>Status</th><th>Execution time</th><th>Retries</th><th>Execution</th><th>Node</th><th>Last error</th><th>Actions</th></tr></thead><tbody>{timers.data?.map((timer) => <tr key={timer.timer_id}><td><span className={`timer-status ${timer.status}`}>{timer.status}</span></td><td><time dateTime={timer.due_at}>{formatTime(timer.due_at)}</time></td><td>{timer.attempt_count} / {timer.max_attempts}</td><td>{timer.execution_id}</td><td>{timer.node_id}</td><td>{timer.last_error ?? '—'}</td><td>{canManage(timer) && <><button disabled={timer.status === 'cancelled' || cancel.isPending} onClick={() => cancel.mutate(timer.timer_id)}>Cancel</button><button disabled={reschedule.isPending} onClick={() => rescheduleTimerPrompt(timer)}>Reschedule</button></>}</td></tr>)}{timers.data?.length === 0 && <tr><td colSpan={7}>No timers recorded.</td></tr>}</tbody></table></main>
}
