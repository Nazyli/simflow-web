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

export interface ChatWorkflowItem {
  workflow_version_id: string
  workflow_name: string
  version_number: number
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

export const getChatWorkflows = (participantId: string) =>
  apiClient<ChatWorkflowItem[]>(
    `/runner/chat/workflows?participant_id=${encodeURIComponent(participantId)}`,
  )
export const getChatActors = (participantId: string, workflowVersionId: string) =>
  apiClient<ChatActorItem[]>(
    `/runner/chat/actors?participant_id=${encodeURIComponent(participantId)}&workflow_version_id=${encodeURIComponent(workflowVersionId)}`,
  )
export const getChatMessages = (
  participantId: string,
  workflowVersionId: string,
  actorId: string,
) =>
  apiClient<ChatMessage[]>(
    `/runner/chat/messages?participant_id=${encodeURIComponent(participantId)}&workflow_version_id=${encodeURIComponent(workflowVersionId)}&actor_id=${encodeURIComponent(actorId)}`,
  )
export const sendParticipantChat = (
  participantId: string,
  actorId: string,
  content: string,
  workflowVersionId: string,
) =>
  apiClient<ChatMessage>(`/runner/chat?participant_id=${encodeURIComponent(participantId)}`, {
    method: 'POST',
    body: JSON.stringify({ actor_id: actorId, content, workflow_version_id: workflowVersionId }),
  })
export const markChatMessageRead = (
  participantId: string,
  workflowVersionId: string,
  actorId: string,
) =>
  apiClient<ChatMarkAsReadResult>(
    `/runner/chat/mark-as-read?participant_id=${encodeURIComponent(participantId)}&workflow_version_id=${encodeURIComponent(workflowVersionId)}&actor_id=${encodeURIComponent(actorId)}`,
    { method: 'POST' },
  )
