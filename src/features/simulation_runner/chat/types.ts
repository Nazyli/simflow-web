export interface ChatMessage {
  to: string
  from: string
  actor: string
  channel: 'chat'
  chat_id: string | null
  content: string
  timestamp: string
  action_type: string
}

export interface ChatConversation {
  actor: string
  actorName: string
  messages: ChatMessage[]
  lastMessage: ChatMessage | null
}
