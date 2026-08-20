import { apiClient } from './client'

export interface RuntimeEmailAttachment {
  attachment_id: string
  master_attachment_id: string
  doc_content_id: string | null
  document_id: string | null
  document_name: string
  opened_at: string | null
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
  workflow_version_id: string | null
  parent_email_id: string | null
  reply_to_email_id: string | null
  master_email_id: string | null
  is_read: boolean
  read_at: string | null
  created_date: string
  attachments: RuntimeEmailAttachment[]
}

export interface EmailWorkflowItem {
  workflow_version_id: string
  workflow_name: string
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
  workflow_version_id: string | null
}

export interface EmailMarkAsReadResult {
  status: string
  count: number
}

export const getEmailWorkflows = (participantId: string) =>
  apiClient<EmailWorkflowItem[]>(
    `/runner/email/workflows?participant_id=${encodeURIComponent(participantId)}`,
  )

export const getEmailInbox = (participantId: string, workflowVersionId?: string) => {
  const params = new URLSearchParams({ participant_id: participantId })
  if (workflowVersionId) params.set('workflow_version_id', workflowVersionId)
  return apiClient<EmailInboxThreadItem[]>(`/runner/email/inbox?${params.toString()}`)
}

export const getEmailThreadMessages = (
  participantId: string,
  workflowVersionId: string,
  rootId: string,
) =>
  apiClient<EmailMessage[]>(
    `/runner/email/thread-messages?participant_id=${encodeURIComponent(participantId)}&workflow_version_id=${encodeURIComponent(workflowVersionId)}&root_id=${encodeURIComponent(rootId)}`,
  )

export const sendParticipantEmail = (
  participantId: string,
  partnerId: string,
  subject: string,
  content: string,
  workflowVersionId: string,
  to?: string[],
  cc?: string[],
  parentEmailId?: string,
  replyToEmailId?: string,
) =>
  apiClient<EmailMessage>(`/runner/email?participant_id=${encodeURIComponent(participantId)}`, {
    method: 'POST',
    body: JSON.stringify({
      partner_id: partnerId,
      subject,
      content,
      workflow_version_id: workflowVersionId,
      to: to ?? [],
      cc: cc ?? [],
      ...(parentEmailId ? { parent_email_id: parentEmailId } : {}),
      ...(replyToEmailId ? { reply_to_email_id: replyToEmailId } : {}),
    }),
  })

export const markEmailThreadAsRead = (
  participantId: string,
  workflowVersionId: string,
  rootId: string,
) =>
  apiClient<EmailMarkAsReadResult>(
    `/runner/email/mark-thread-read?participant_id=${encodeURIComponent(participantId)}&workflow_version_id=${encodeURIComponent(workflowVersionId)}&root_id=${encodeURIComponent(rootId)}`,
    { method: 'POST' },
  )

export const markEmailAttachmentOpened = (
  attachmentId: string,
  participantId: string,
  workflowVersionId: string,
  participantEmailId: string,
) => {
  const params = new URLSearchParams({
    participant_id: participantId,
    workflow_version_id: workflowVersionId,
    participant_email_id: participantEmailId,
  })
  return apiClient<RuntimeEmailAttachment>(
    `/runner/email/attachments/${encodeURIComponent(attachmentId)}/opened?${params.toString()}`,
    { method: 'POST' },
  )
}
