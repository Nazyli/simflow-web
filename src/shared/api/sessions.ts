import { apiClient } from './client'

export interface ExecutionHistoryItem {
  executionId: string
  sessionId: string
  participantId: string
  groupSimulationName: string | null
  simulationId: string
  simulationName: string | null
  status: string
  currentNodeId: string | null
  startedAt: string
  completedAt: string | null
  unreadCounts: Record<'chat' | 'email' | 'call' | 'document', number>
  createdAt: string
  lastActivityAt: string
}

export const getExecutionHistory = () => apiClient<ExecutionHistoryItem[]>('/history/executions')
