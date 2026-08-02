import { apiClient } from './client'

export interface SessionChannelEvent {
  event_id?: string
  message_id?: string
  workflow_label?: string
  conversation_id?: string
  wait_instance_id?: string
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
  workflow_version_id: string
  status: string
  email_inbox: SessionChannelEvent[]
  chat_inbox: SessionChannelEvent[]
  document_state: SessionChannelEvent[]
  call_state: SessionChannelEvent[]
  created_at: string
  completed_at: string | null
}

export interface SimulationSessionSummary {
  session_id: string
  participant_id: string
  workflow_version_id: string
  status: string
  created_at: string
  last_activity_at: string
  completed_at: string | null
}

export const getSession = (sessionId: string) => apiClient<SimulationSession>(`/sessions/${sessionId}`)
export const getSessionsForParticipant = (participantId: string) => apiClient<SimulationSessionSummary[]>(`/sessions?participant_id=${encodeURIComponent(participantId)}`)
export const markSessionChannelEventsRead = (sessionId: string, channel: string, messageIds: string[]) => apiClient<SimulationSession>(`/sessions/${sessionId}/channel-events/read`, { method: 'POST', body: JSON.stringify({ channel, message_ids: messageIds }) })
