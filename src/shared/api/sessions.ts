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

export interface SimulationSession {
  session_id: string
  participant_id: string
  execution_id: string | null
  status: string
  email_inbox: SessionChannelEvent[]
  call_state: SessionChannelEvent[]
  created_at: string
  completed_at: string | null
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

export interface DocumentState {
  document_id: string
  state: Record<string, unknown>
  updated_at: string
}

export const getSession = (sessionId: string) => apiClient<SimulationSession>(`/history/sessions/${sessionId}`)
export const getSessionsForParticipant = (participantId: string) => apiClient<SimulationSessionSummary[]>(`/history/sessions?participant_id=${encodeURIComponent(participantId)}`)
export const getDocumentState = (sessionId: string) => apiClient<DocumentState[]>(`/history/sessions/${sessionId}/channels/document/state`)
