import { apiClient } from './client'

export interface ChatMessage {
  participantChatId: string
  sessionId: string
  chatPartnerId: string
  senderId: string
  senderType: 'participant' | 'actor'
  content: string
  simulationId: string | null
  isRead: boolean
  readAt: string | null
  createdDate: string
}

export interface ChatSimulationItem {
  simulationId: string
  groupSimulationName: string
  simulationName: string | null
  status: string
  unreadCount: number
}

export interface ChatActorItem {
  actorId: string
  actorName: string
  unreadCount: number
}

export interface ChatMarkAsReadResult {
  status: string
  count: number
}

export const getChatSimulations = (participantId: string) =>
  apiClient<ChatSimulationItem[]>(
    `/web/chat/master_group_simulations?participantId=${encodeURIComponent(participantId)}`,
  )
export const getChatActors = (participantId: string, simulationId: string) =>
  apiClient<ChatActorItem[]>(
    `/web/chat/actors?participantId=${encodeURIComponent(participantId)}&simulationId=${encodeURIComponent(simulationId)}`,
  )
export const getChatMessages = (participantId: string, simulationId: string, actorId: string) =>
  apiClient<ChatMessage[]>(
    `/web/chat/messages?participantId=${encodeURIComponent(participantId)}&simulationId=${encodeURIComponent(simulationId)}&actorId=${encodeURIComponent(actorId)}`,
  )
export const sendParticipantChat = (
  participantId: string,
  actorId: string,
  content: string,
  simulationId: string,
) =>
  apiClient<ChatMessage>(`/web/chat?participantId=${encodeURIComponent(participantId)}`, {
    method: 'POST',
    body: JSON.stringify({ actorId, content, simulationId }),
  })
export const markChatMessageRead = (participantId: string, simulationId: string, actorId: string) =>
  apiClient<ChatMarkAsReadResult>(
    `/web/chat/mark-as-read?participantId=${encodeURIComponent(participantId)}&simulationId=${encodeURIComponent(simulationId)}&actorId=${encodeURIComponent(actorId)}`,
    { method: 'POST' },
  )
