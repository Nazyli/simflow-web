import type { EmailMessage } from './types'

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
