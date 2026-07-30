import { apiClient } from './client'

export interface SessionChannelEvent {
  channel?: string
  action_type?: string
  actor?: string
  content?: string
  timestamp?: string
  [key: string]: unknown
}

export interface SimulationSession {
  session_id: string
  participant_id: string
  workflow_version_id: string
  status: string
  variables: Record<string, unknown>
  email_inbox: SessionChannelEvent[]
  chat_inbox: SessionChannelEvent[]
  document_state: SessionChannelEvent[]
  call_state: SessionChannelEvent[]
  created_at: string
  completed_at: string | null
}

export const getSession = (sessionId: string) => apiClient<SimulationSession>(`/sessions/${sessionId}`)
