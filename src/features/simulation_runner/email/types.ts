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
