import { apiClient } from './client'

interface RuntimeEmailAttachmentContent {
  participantAttachmentEmailId: string
  emailAttachmentId: string
  participantDocContentId: string | null
  page: number | null
  content: string | null
  isHighlight: boolean
  ownerName: string | null
}

export interface RuntimeEmailAttachment {
  emailAttachmentId: string
  participantEmailId: string
  participantDocId: string | null
  masterAttachmentId: string | null
  documentId: string | null
  fileName: string | null
  isHighlight: boolean
  ownerName: string | null
  openedAt: string | null
  modifiedDate: string | null
  contents: RuntimeEmailAttachmentContent[]
}

export interface EmailMessage {
  participantEmailId: string
  sessionId: string
  emailPartnerId: string
  senderId: string
  senderType: 'participant' | 'actor'
  subject: string
  content: string
  to: string[]
  cc: string[]
  simulationId: string | null
  parentEmailId: string | null
  replyToEmailId: string | null
  masterEmailId: string | null
  isRead: boolean
  readAt: string | null
  createdDate: string
  attachments: RuntimeEmailAttachment[]
}

interface EmailSimulationItem {
  simulationId: string
  groupSimulationName: string
  simulationName: string | null
  status: string
  unreadCount: number
}

export interface EmailInboxThreadItem {
  rootId: string
  latestMessageId: string
  latestSenderId: string
  latestSenderType: string
  latestSubject: string
  latestContent: string
  latestIsRead: boolean
  latestCreatedDate: string
  unreadCount: number
  messageCount: number
  simulationId: string | null
}

export interface EmailMarkAsReadResult {
  status: string
  count: number
}

export interface ParticipantEmailAttachmentContentInput {
  participantDocContentId: string
}

export interface ParticipantEmailAttachmentInput {
  participantDocId: string
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
