export interface ChatMessage {
  to: string
  from: string
  actor: string
  channel: 'chat'
  chat_id: string | null
  message_id?: string
  content: string
  timestamp: string
  action_type: string
  conversation_id?: string
  workflow_label?: string
  workflow_version_id?: string
}

export interface ChatConversation {
  actor: string
  actorName: string
  messages: ChatMessage[]
  lastMessage: ChatMessage | null
}
