import { apiClient } from './client'

export type WorkflowTimer = { timer_id: string; session_id: string | null; execution_id: string; node_id: string; status: string; due_at: string; attempt_count: number; max_attempts: number; retry_delay_seconds: number; last_error: string | null; cancelled_at: string | null; created_date: string }

export const getTimers = () => apiClient<WorkflowTimer[]>('/timers')
export const cancelTimer = (timerId: string) => apiClient<WorkflowTimer>(`/timers/${timerId}/cancel`, { method: 'POST' })
export const rescheduleTimer = (timerId: string, dueAt: string) => apiClient<WorkflowTimer>(`/timers/${timerId}/reschedule`, { method: 'POST', body: JSON.stringify({ due_at: dueAt }) })
