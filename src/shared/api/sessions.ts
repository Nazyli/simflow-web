import { apiClient } from './client'

export interface SessionChannelEvent {
  event_id?: string
  message_id?: string
  workflow_label?: string
  node_execution_id?: string
  channel?: string
  action_type?: string
  actor?: string
  content?: string
  timestamp?: string
  is_read?: boolean
  [key: string]: unknown
}

export interface SimulationSessionSummary {
  session_id: string
  participant_id: string
  execution_id: string | null
  status: string
  unread_counts: Record<'chat' | 'email' | 'call' | 'document', number>
  created_at: string
  last_activity_at: string
  completed_at: string | null
}

export const getSessionsForParticipant = (participantId: string) => apiClient<SimulationSessionSummary[]>(`/history/sessions?participant_id=${encodeURIComponent(participantId)}`)
