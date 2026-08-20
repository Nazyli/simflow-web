export interface EmailMessage {
  to: string[]
  cc: string[]
  from: string
  actor: string
  channel: 'email'
  email_id: string | null
  message_id?: string
  session_id?: string
  subject: string
  content: string
  timestamp: string
  action_type: string
  workflow_label?: string
  workflow_version_id?: string
  is_unread?: boolean
  attachments: EmailAttachment[]
}

export interface EmailAttachment {
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
  contents: EmailAttachmentContent[]
}

export interface EmailAttachmentContent {
  participant_attachment_email_id: string
  email_attachment_id: string
  participant_doc_content_id: string | null
  page: number | null
  content: string | null
  is_highlight: boolean
  owner_name: string | null
}

export function sortAttachmentPreviewPages<T extends EmailAttachmentContent>(
  contents: readonly T[],
): T[] {
  return [...contents].sort((first, second) => {
    const firstPage = first.page ?? Number.MAX_SAFE_INTEGER
    const secondPage = second.page ?? Number.MAX_SAFE_INTEGER
    return (
      firstPage - secondPage ||
      first.participant_attachment_email_id.localeCompare(second.participant_attachment_email_id)
    )
  })
}

export interface EmailWorkflow {
  workflowVersionId: string
  workflowName: string
  versionNumber: number
  status: string
  unreadCount: number
}

export interface EmailInboxThread {
  rootId: string
  latestSenderId: string
  latestSenderType: string
  latestSubject: string
  latestContent: string
  latestIsRead: boolean
  latestCreatedDate: string
  unreadCount: number
  messageCount: number
  workflowVersionId: string | null
}
