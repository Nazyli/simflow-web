import { apiClient } from './client'

export type TransParticipantTimer = {
  participantTimerId: string
  nodeExecutionId: string
  sessionId: string | null
  executionId: string | null
  nodeId: string | null
  nodeType: string | null
  nodeName: string | null
  nodeConfiguration: Record<string, unknown> | null
  participantId: string | null
  groupSimulationName: string | null
  simulationName: string | null
  masterSimulation?: string | null
  status: string
  dueAt: string
  attemptCount: number
  maxAttempts: number
  retryDelaySeconds: number
  lastError: string | null
  cancelledAt: string | null
  createdDate: string
}

export const getTimers = () => apiClient<TransParticipantTimer[]>('/admin/timers')
export const cancelTimer = (participantTimerId: string) =>
  apiClient<TransParticipantTimer>(`/admin/timers/${participantTimerId}/cancel`, { method: 'POST' })
export const rescheduleTimer = (participantTimerId: string, dueAt: string) =>
  apiClient<TransParticipantTimer>(`/admin/timers/${participantTimerId}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ dueAt: dueAt }),
  })
export const runTimerNow = (participantTimerId: string) =>
  apiClient<TransParticipantTimer>(`/admin/timers/${participantTimerId}/run-now`, { method: 'POST' })
