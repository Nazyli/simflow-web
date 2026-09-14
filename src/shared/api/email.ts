import { apiClient } from './client'

interface RuntimeEmailAttachmentContent {
  participant_attachment_email_id: string
  email_attachment_id: string
  participant_doc_content_id: string | null
  page: number | null
  content: string | null
  is_highlight: boolean
  owner_name: string | null
}

export interface RuntimeEmailAttachment {
  email_attachment_id: string
  participant_email_id: string
  participant_doc_id: string | null
  master_attachment_id: string | null
  document_id: string | null
  file_name: string | null
  is_highlight: boolean
  owner_name: string | null
  opened_at: string | null
  modified_date: string | null
  contents: RuntimeEmailAttachmentContent[]
}

export interface EmailMessage {
  participant_email_id: string
  session_id: string
  email_partner_id: string
  sender_id: string
  sender_type: 'participant' | 'actor'
  subject: string
  content: string
  to: string[]
  cc: string[]
  simulation_id: string | null
  parent_email_id: string | null
  reply_to_email_id: string | null
  master_email_id: string | null
  is_read: boolean
  read_at: string | null
  created_date: string
  attachments: RuntimeEmailAttachment[]
}

interface EmailSimulationItem {
  simulation_id: string
  group_simulation_name: string
  simulation_name: string | null
  status: string
  unread_count: number
}

export interface EmailInboxThreadItem {
  root_id: string
  latest_message_id: string
  latest_sender_id: string
  latest_sender_type: string
  latest_subject: string
  latest_content: string
  latest_is_read: boolean
  latest_created_date: string
  unread_count: number
  message_count: number
  simulation_id: string | null
}

export interface EmailMarkAsReadResult {
  status: string
  count: number
}

export interface ParticipantEmailAttachmentContentInput {
  participant_doc_content_id: string
}

export interface ParticipantEmailAttachmentInput {
  participant_doc_id: string
  contents: ParticipantEmailAttachmentContentInput[]
}

export const getEmailSimulations = (participantId: string) =>
  apiClient<EmailSimulationItem[]>(
    `/runner/email/master_group_simulations?participantId=${encodeURIComponent(participantId)}`,
  )

export const getEmailInbox = (participantId: string, simulationId?: string) => {
  const params = new URLSearchParams({ participantId })
  if (simulationId) params.set('simulationId', simulationId)
  return apiClient<EmailInboxThreadItem[]>(`/runner/email/inbox?${params.toString()}`)
}

export const getEmailThreadMessages = (
  participantId: string,
  simulationId: string,
  rootId: string,
) =>
  apiClient<EmailMessage[]>(
    `/runner/email/thread-messages?participantId=${encodeURIComponent(participantId)}&simulationId=${encodeURIComponent(simulationId)}&rootId=${encodeURIComponent(rootId)}`,
  )

export const sendParticipantEmail = (
  participantId: string,
  partnerId: string,
  subject: string,
  content: string,
  simulationId: string,
  to?: string[],
  cc?: string[],
  parentEmailId?: string,
  replyToEmailId?: string,
  attachments?: ParticipantEmailAttachmentInput[],
) =>
  apiClient<EmailMessage>(`/runner/email?participantId=${encodeURIComponent(participantId)}`, {
    method: 'POST',
    body: JSON.stringify({
      partnerId,
      subject,
      content,
      simulationId,
      to: to ?? [],
      cc: cc ?? [],
      ...(parentEmailId ? { parentEmailId } : {}),
      ...(replyToEmailId ? { replyToEmailId } : {}),
      ...(attachments?.length ? { attachments } : {}),
    }),
  })

export const markEmailThreadAsRead = (
  participantId: string,
  simulationId: string,
  rootId: string,
) =>
  apiClient<EmailMarkAsReadResult>(
    `/runner/email/mark-thread-read?participantId=${encodeURIComponent(participantId)}&simulationId=${encodeURIComponent(simulationId)}&rootId=${encodeURIComponent(rootId)}`,
    { method: 'POST' },
  )

export const markEmailAttachmentOpened = (
  attachmentId: string,
  participantId: string,
  simulationId: string,
  participantEmailId: string,
) => {
  const params = new URLSearchParams({
    participantId,
    simulationId,
    participantEmailId,
  })
  return apiClient<RuntimeEmailAttachment>(
    `/runner/email/attachments/${encodeURIComponent(attachmentId)}/opened?${params.toString()}`,
    { method: 'POST' },
  )
}
