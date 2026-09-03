import { apiClient } from './client'

export type SimulationTimer = {
  timer_id: string
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

export const getTimers = () => apiClient<SimulationTimer[]>('/timers')
export const cancelTimer = (timerId: string) =>
  apiClient<SimulationTimer>(`/timers/${timerId}/cancel`, { method: 'POST' })
export const rescheduleTimer = (timerId: string, dueAt: string) =>
  apiClient<SimulationTimer>(`/timers/${timerId}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ due_at: dueAt }),
  })
export const runTimerNow = (timerId: string) =>
  apiClient<SimulationTimer>(`/timers/${timerId}/run-now`, { method: 'POST' })
