import type { ChatConversation, ChatMessage } from './types'

export function formatChatTime(timestamp?: string): string {
  if (!timestamp) return 'Just now'
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? 'Just now' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function isOwnMessage(message: ChatMessage, participantId: string): boolean {
  return message.from ? message.from === participantId : message.actor === participantId
}

export function messageKey(message: ChatMessage): string {
  return message.message_id ?? [message.timestamp, message.content].filter(Boolean).join(':')
}

export function buildActorNames(actors: Record<string, unknown>[]): Record<string, string> {
  const names: Record<string, string> = {}
  for (const actor of actors) {
    const id = String(actor.actor_id ?? '')
    if (id) names[id] = String(actor.actor_name ?? id)
  }
  return names
}

export function buildConversations(messages: ChatMessage[], actorNames: Record<string, string>, participantId: string): ChatConversation[] {
  const grouped = new Map<string, ChatMessage[]>()
  for (const message of messages) {
    const sender = message.from || message.actor
    const counterpart = sender === participantId ? message.to : sender
    if (!counterpart || counterpart === participantId) continue
    const list = grouped.get(counterpart) ?? []
    list.push(message)
    grouped.set(counterpart, list)
  }
  const actorIds = new Set<string>([...grouped.keys(), ...Object.keys(actorNames)].filter((id) => id && id !== participantId))
  return [...actorIds]
    .map((actor) => {
      const list = grouped.get(actor) ?? []
      return {
        actor,
        actorName: actorNames[actor] ?? actor,
        messages: list,
        lastMessage: list[list.length - 1] ?? null,
        unreadCount: list.filter((message) => message.is_unread).length,
      }
    })
    .sort((a, b) => {
      const aTime = a.lastMessage ? messageTime(a.lastMessage) : 0
      const bTime = b.lastMessage ? messageTime(b.lastMessage) : 0
      if (aTime !== bTime) return bTime - aTime
      return a.actorName.localeCompare(b.actorName)
    })
}

function messageTime(message: ChatMessage): number {
  const time = new Date(message.timestamp).getTime()
  return Number.isNaN(time) ? 0 : time
}
