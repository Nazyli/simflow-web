import { apiClient } from './client'

export type TransParticipantTimer = {
  participant_timer_id: string
  node_execution_id: string
  session_id: string | null
  execution_id: string | null
  node_id: string | null
  node_type: string | null
  node_name: string | null
  node_configuration: Record<string, unknown> | null
  participant_id: string | null
  group_simulation_name: string | null
  master_simulation: number | null
  status: string
  due_at: string
  attempt_count: number
  max_attempts: number
  retry_delay_seconds: number
  last_error: string | null
  cancelled_at: string | null
  created_date: string
}

export const getTimers = () => apiClient<TransParticipantTimer[]>('/timers')
export const cancelTimer = (participantTimerId: string) =>
  apiClient<TransParticipantTimer>(`/timers/${participantTimerId}/cancel`, { method: 'POST' })
export const rescheduleTimer = (participantTimerId: string, dueAt: string) =>
  apiClient<TransParticipantTimer>(`/timers/${participantTimerId}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ due_at: dueAt }),
  })
export const runTimerNow = (participantTimerId: string) =>
  apiClient<TransParticipantTimer>(`/timers/${participantTimerId}/run-now`, { method: 'POST' })
