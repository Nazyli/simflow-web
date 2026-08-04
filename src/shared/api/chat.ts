import { apiClient } from './client'

export interface ChatMessage {
  participant_chat_id: string
  session_id: string
  chat_partner_id: string
  sender_id: string
  sender_type: 'participant' | 'actor'
  content: string
  is_read: boolean
  read_at: string | null
  created_date: string
}

export const getChatMessages = (sessionId: string) => apiClient<ChatMessage[]>(`/runner/sessions/${sessionId}/chat`)
export const sendParticipantChat = (sessionId: string, actorId: string, content: string) => apiClient<ChatMessage>(`/runner/sessions/${sessionId}/chat`, { method: 'POST', body: JSON.stringify({ actor_id: actorId, content }) })
export const markChatMessageRead = (sessionId: string, messageId: string) => apiClient<ChatMessage>(`/runner/sessions/${sessionId}/chat/messages/${messageId}/read`, { method: 'POST' })
