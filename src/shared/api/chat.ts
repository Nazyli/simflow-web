import { apiClient } from './client'

export interface ChatMessage {
  participant_chat_id: string
  session_id: string
  chat_partner_id: string
  sender_id: string
  sender_type: 'participant' | 'actor'
  content: string
  workflow_version_id: string | null
  is_read: boolean
  read_at: string | null
  created_date: string
}

export const getChatMessages = (sessionId: string, workflowVersionId?: string) => {
  const params = new URLSearchParams({ session_id: sessionId })
  if (workflowVersionId) params.set('workflow_version_id', workflowVersionId)
  return apiClient<ChatMessage[]>(`/runner/chat?${params.toString()}`)
}
export const sendParticipantChat = (sessionId: string, actorId: string, content: string, workflowVersionId: string) =>
  apiClient<ChatMessage>(`/runner/chat?session_id=${encodeURIComponent(sessionId)}`, { method: 'POST', body: JSON.stringify({ actor_id: actorId, content, workflow_version_id: workflowVersionId }) })
export const markChatMessageRead = (sessionId: string, messageId: string) =>
  apiClient<ChatMessage>(`/runner/chat/read?session_id=${encodeURIComponent(sessionId)}&message_id=${encodeURIComponent(messageId)}`, { method: 'POST' })
