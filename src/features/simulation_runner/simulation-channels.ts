import { FileText, Mail, MessageCircle, Phone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Channel = 'chat' | 'email' | 'call' | 'document'

export interface ChannelNavItem {
  channel: Channel
  label: string
  description: string
  icon: LucideIcon
}

export const channelNavigation: ChannelNavItem[] = [
  { channel: 'chat', label: 'Conversations', description: 'Chat with the actors of the running simulation.', icon: MessageCircle },
  { channel: 'email', label: 'Email', description: 'Read and reply to email activity.', icon: Mail },
  { channel: 'call', label: 'Call', description: 'Handle incoming call activity.', icon: Phone },
  { channel: 'document', label: 'Document', description: 'Open and review documents.', icon: FileText },
]

export function channelPath(participantId: string, channel: Channel): string {
  return `/simulation/${encodeURIComponent(participantId)}/${channel}`
}
