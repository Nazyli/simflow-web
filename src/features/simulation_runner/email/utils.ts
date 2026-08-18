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
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isThisYear = date.getFullYear() === now.getFullYear()
  if (isThisYear) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export function isOwnEmail(message: EmailMessage, participantId: string): boolean {
  return message.from ? message.from === participantId : message.actor === participantId
}

export function emailMessageKey(message: EmailMessage): string {
  return message.message_id ?? [message.timestamp, message.content].filter(Boolean).join(':')
}
