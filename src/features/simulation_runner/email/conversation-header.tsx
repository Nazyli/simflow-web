import type { EmailInboxThread, EmailMessage } from './types'

interface ConversationHeaderProps {
  thread: EmailInboxThread | null
  messages: EmailMessage[]
}

export function ConversationHeader({ thread, messages }: ConversationHeaderProps) {
  if (!thread) {
    return (
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
        <p className="text-sm font-medium text-[#9aa0a6]">No conversation selected</p>
      </div>
    )
  }
  const count = messages.length
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-slate-600">
          {thread.latestSubject || '(no subject)'}
        </p>
      </div>
      <span className="ml-4 shrink-0 text-xs text-[#5f6368]">
        {count} message{count === 1 ? '' : 's'}
      </span>
    </div>
  )
}
