export interface ChatMessage {
  to: string
  from: string
  actor: string
  senderType: 'participant' | 'actor' | 'system'
  channel: 'chat'
  chatId: string | null
  messageId?: string
  sessionId?: string
  content: string
  timestamp: string
  actionType: string
  simulationLabel?: string
  simulationId?: string
  isUnread?: boolean
}

export interface ChatConversation {
  actor: string
  actorName: string
  messages: ChatMessage[]
  lastMessage: ChatMessage | null
  unreadCount: number
}

export interface ChatSimulation {
  simulationId: string
  groupSimulationName: string
  simulationName: string | null
  status: string
  unreadCount: number
}

export interface ChatActor {
  actorId: string
  actorName: string
  unreadCount: number
}
