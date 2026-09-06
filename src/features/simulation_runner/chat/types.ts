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
  simulation_label?: string
  simulation_id?: string
  is_unread?: boolean
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
