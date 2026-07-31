import type { ChatConversation, ChatMessage } from './types'

export function formatChatTime(timestamp?: string): string {
  if (!timestamp) return 'Just now'
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? 'Just now' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function isOwnMessage(message: ChatMessage, participantId: string): boolean {
  return message.from ? message.from === participantId : message.actor === participantId
}

export function buildActorNames(actors: Record<string, unknown>[]): Record<string, string> {
  const names: Record<string, string> = {}
  for (const actor of actors) {
    const id = String(actor.actor_id ?? '')
    if (id) names[id] = String(actor.actor_name ?? id)
  }
  return names
}

export function buildConversations(messages: ChatMessage[], actorNames: Record<string, string>): ChatConversation[] {
  const grouped = new Map<string, ChatMessage[]>()
  for (const message of messages) {
    const actor = message.actor || message.from || 'unknown'
    const list = grouped.get(actor) ?? []
    list.push(message)
    grouped.set(actor, list)
  }
  const actorIds = new Set<string>([...grouped.keys(), ...Object.keys(actorNames)])
  return [...actorIds]
    .map((actor) => {
      const list = grouped.get(actor) ?? []
      return {
        actor,
        actorName: actorNames[actor] ?? actor,
        messages: list,
        lastMessage: list[list.length - 1] ?? null,
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
