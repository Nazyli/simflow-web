import { apiClient } from './client'

export interface ExecutionHistoryItem {
  execution_id: string
  session_id: string
  participant_id: string
  workflow_name: string | null
  workflow_version_id: string
  version_number: number | null
  status: string
  current_node_id: string | null
  started_at: string
  completed_at: string | null
  unread_counts: Record<'chat' | 'email' | 'call' | 'document', number>
  created_at: string
  last_activity_at: string
}

export const getExecutionHistory = () => apiClient<ExecutionHistoryItem[]>('/history/executions')
