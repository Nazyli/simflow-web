import { FileText, Mail, Phone } from 'lucide-react'
import type { Channel } from './simulation-channels'
import { EmailChannelPage as EmailChannelPageImpl } from './email-channel-page'

const CONTENT: Record<
  Exclude<Channel, 'chat'>,
  { title: string; description: string; icon: typeof Mail }
> = {
  email: {
    title: 'Email',
    description:
      'Email action is planned but not available yet. The Conversations channel is the active runner channel for now.',
    icon: Mail,
  },
  call: {
    title: 'Call',
    description:
      'Call handling is planned but not available yet. The Conversations channel is the active runner channel for now.',
    icon: Phone,
  },
  document: {
    title: 'Document',
    description:
      'Document review is planned but not available yet. The Conversations channel is the active runner channel for now.',
    icon: FileText,
  },
}

export function EmailChannelPage() {
  return <EmailChannelPageImpl />
}

export function CallChannelPage() {
  return <ChannelPlaceholder channel="call" />
}

export function DocumentChannelPage() {
  return <ChannelPlaceholder channel="document" />
}

function ChannelPlaceholder({ channel }: { channel: Exclude<Channel, 'chat'> }) {
  const { title, description, icon: Icon } = CONTENT[channel]
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
      <div className="max-w-sm">
        <Icon className="mx-auto mb-3 text-violet-500" size={28} />
        <h2 className="text-sm font-semibold text-slate-900">{title} — coming soon</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  )
}
