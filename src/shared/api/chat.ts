import { apiClient } from './client'

export interface ChatMessage {
  participant_chat_id: string
  session_id: string
  chat_partner_id: string
  sender_id: string
  sender_type: 'participant' | 'actor'
  content: string
  simulation_id: string | null
  is_read: boolean
  read_at: string | null
  created_date: string
}

export interface ChatSimulationItem {
  simulation_id: string
  group_simulation_name: string
  simulation_name: string | null
  status: string
  unread_count: number
}

export interface ChatActorItem {
  actor_id: string
  actor_name: string
  unread_count: number
}

export interface ChatMarkAsReadResult {
  status: string
  count: number
}

export const getChatSimulations = (participantId: string) =>
  apiClient<ChatSimulationItem[]>(
    `/runner/chat/master_group_simulations?participantId=${encodeURIComponent(participantId)}`,
  )
export const getChatActors = (participantId: string, simulationId: string) =>
  apiClient<ChatActorItem[]>(
    `/runner/chat/actors?participantId=${encodeURIComponent(participantId)}&simulationId=${encodeURIComponent(simulationId)}`,
  )
export const getChatMessages = (participantId: string, simulationId: string, actorId: string) =>
  apiClient<ChatMessage[]>(
    `/runner/chat/messages?participantId=${encodeURIComponent(participantId)}&simulationId=${encodeURIComponent(simulationId)}&actorId=${encodeURIComponent(actorId)}`,
  )
export const sendParticipantChat = (
  participantId: string,
  actorId: string,
  content: string,
  simulationId: string,
) =>
  apiClient<ChatMessage>(`/runner/chat?participantId=${encodeURIComponent(participantId)}`, {
    method: 'POST',
    body: JSON.stringify({ actorId, content, simulationId }),
  })
export const markChatMessageRead = (participantId: string, simulationId: string, actorId: string) =>
  apiClient<ChatMarkAsReadResult>(
    `/runner/chat/mark-as-read?participantId=${encodeURIComponent(participantId)}&simulationId=${encodeURIComponent(simulationId)}&actorId=${encodeURIComponent(actorId)}`,
    { method: 'POST' },
  )
