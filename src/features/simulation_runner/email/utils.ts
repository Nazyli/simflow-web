import type { EmailConversation, EmailMessage } from './types'

export function formatEmailTime(timestamp?: string): string {
  if (!timestamp) return 'Just now'
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime())
    ? 'Just now'
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatEmailDate(timestamp?: string): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function isOwnEmail(message: EmailMessage, participantId: string): boolean {
  return message.from ? message.from === participantId : message.actor === participantId
}

export function emailMessageKey(message: EmailMessage): string {
  return message.message_id ?? [message.timestamp, message.content].filter(Boolean).join(':')
}

export function buildEmailConversations(
  messages: EmailMessage[],
  actorNames: Record<string, string>,
  participantId: string,
): EmailConversation[] {
  const grouped = new Map<string, EmailMessage[]>()
  for (const message of messages) {
    const sender = message.from || message.actor
    const counterpart = sender === participantId
      ? (message.to.length > 0 ? message.to[0] : message.actor)
      : sender
    if (!counterpart || counterpart === participantId) continue
    const list = grouped.get(counterpart) ?? []
    list.push(message)
    grouped.set(counterpart, list)
  }
  const actorIds = new Set<string>(
    [...grouped.keys(), ...Object.keys(actorNames)].filter((id) => id && id !== participantId),
  )
  return [...actorIds]
    .map((actor) => {
      const list = grouped.get(actor) ?? []
      return {
        actor,
        actorName: actorNames[actor] ?? actor,
        messages: list,
        lastMessage: list[list.length - 1] ?? null,
        unreadCount: list.filter(
          (message) => message.is_unread && !isOwnEmail(message, participantId),
        ).length,
      }
    })
    .sort((a, b) => {
      const aTime = a.lastMessage ? emailMessageTime(a.lastMessage) : 0
      const bTime = b.lastMessage ? emailMessageTime(b.lastMessage) : 0
      if (aTime !== bTime) return bTime - aTime
      return a.actorName.localeCompare(b.actorName)
    })
}

function emailMessageTime(message: EmailMessage): number {
  const time = new Date(message.timestamp).getTime()
  return Number.isNaN(time) ? 0 : time
}
