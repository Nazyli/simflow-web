import { apiClient } from './client'

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
  is_read: boolean
  read_at: string | null
  created_date: string
}

export interface EmailWorkflowItem {
  workflow_version_id: string
  workflow_name: string
  version_number: number
  status: string
  unread_count: number
}

export interface EmailActorItem {
  actor_id: string
  actor_name: string
  unread_count: number
}

export interface EmailMarkAsReadResult {
  status: string
  count: number
}

export const getEmailWorkflows = (participantId: string) =>
  apiClient<EmailWorkflowItem[]>(
    `/runner/email/workflows?participant_id=${encodeURIComponent(participantId)}`,
  )

export const getEmailActors = (participantId: string, workflowVersionId: string) =>
  apiClient<EmailActorItem[]>(
    `/runner/email/actors?participant_id=${encodeURIComponent(participantId)}&workflow_version_id=${encodeURIComponent(workflowVersionId)}`,
  )

export const getEmailMessages = (
  participantId: string,
  workflowVersionId: string,
  partnerId: string,
) =>
  apiClient<EmailMessage[]>(
    `/runner/email/messages?participant_id=${encodeURIComponent(participantId)}&workflow_version_id=${encodeURIComponent(workflowVersionId)}&partner_id=${encodeURIComponent(partnerId)}`,
  )

export const sendParticipantEmail = (
  participantId: string,
  partnerId: string,
  subject: string,
  content: string,
  workflowVersionId: string,
  to?: string[],
  cc?: string[],
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
    }),
  })

export const markEmailAsRead = (
  participantId: string,
  workflowVersionId: string,
  partnerId: string,
) =>
  apiClient<EmailMarkAsReadResult>(
    `/runner/email/mark-as-read?participant_id=${encodeURIComponent(participantId)}&workflow_version_id=${encodeURIComponent(workflowVersionId)}&partner_id=${encodeURIComponent(partnerId)}`,
    { method: 'POST' },
  )
