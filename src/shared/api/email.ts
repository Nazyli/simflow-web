import { apiClient } from './client'

export interface RuntimeEmailAttachmentContent {
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

export interface EmailSimulationItem {
  simulation_id: string
  group_simulation_name: string
  version_number: number
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
    `/runner/email/master_group_simulations?participant_id=${encodeURIComponent(participantId)}`,
  )

export const getEmailInbox = (participantId: string, simulationId?: string) => {
  const params = new URLSearchParams({ participant_id: participantId })
  if (simulationId) params.set('simulation_id', simulationId)
  return apiClient<EmailInboxThreadItem[]>(`/runner/email/inbox?${params.toString()}`)
}

export const getEmailThreadMessages = (
  participantId: string,
  simulationId: string,
  rootId: string,
) =>
  apiClient<EmailMessage[]>(
    `/runner/email/thread-messages?participant_id=${encodeURIComponent(participantId)}&simulation_id=${encodeURIComponent(simulationId)}&root_id=${encodeURIComponent(rootId)}`,
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
  apiClient<EmailMessage>(`/runner/email?participant_id=${encodeURIComponent(participantId)}`, {
    method: 'POST',
    body: JSON.stringify({
      partner_id: partnerId,
      subject,
      content,
      simulation_id: simulationId,
      to: to ?? [],
      cc: cc ?? [],
      ...(parentEmailId ? { parent_email_id: parentEmailId } : {}),
      ...(replyToEmailId ? { reply_to_email_id: replyToEmailId } : {}),
      ...(attachments?.length ? { attachments } : {}),
    }),
  })

export const markEmailThreadAsRead = (
  participantId: string,
  simulationId: string,
  rootId: string,
) =>
  apiClient<EmailMarkAsReadResult>(
    `/runner/email/mark-thread-read?participant_id=${encodeURIComponent(participantId)}&simulation_id=${encodeURIComponent(simulationId)}&root_id=${encodeURIComponent(rootId)}`,
    { method: 'POST' },
  )

export const markEmailAttachmentOpened = (
  attachmentId: string,
  participantId: string,
  simulationId: string,
  participantEmailId: string,
) => {
  const params = new URLSearchParams({
    participant_id: participantId,
    simulation_id: simulationId,
    participant_email_id: participantEmailId,
  })
  return apiClient<RuntimeEmailAttachment>(
    `/runner/email/attachments/${encodeURIComponent(attachmentId)}/opened?${params.toString()}`,
    { method: 'POST' },
  )
}
