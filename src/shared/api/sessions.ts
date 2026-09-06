import { apiClient } from './client'

export interface ExecutionHistoryItem {
  execution_id: string
  session_id: string
  participant_id: string
  group_simulation_name: string | null
  simulation_id: string
  simulation_name: string | null
  status: string
  current_node_id: string | null
  started_at: string
  completed_at: string | null
  unread_counts: Record<'chat' | 'email' | 'call' | 'document', number>
  created_at: string
  last_activity_at: string
}

export const getExecutionHistory = () => apiClient<ExecutionHistoryItem[]>('/history/executions')
