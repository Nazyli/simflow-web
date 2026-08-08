export interface ChatMessage {
  to: string
  from: string
  actor: string
  channel: 'chat'
  chat_id: string | null
  message_id?: string
  session_id?: string
  content: string
  timestamp: string
  action_type: string
  workflow_label?: string
  workflow_version_id?: string
  is_unread?: boolean
}

export interface ChatConversation {
  actor: string
  actorName: string
  messages: ChatMessage[]
  lastMessage: ChatMessage | null
  unreadCount: number
}

export interface ChatWorkflow {
  workflowVersionId: string
  workflowName: string
  versionNumber: number
  status: string
  unreadCount: number
}
