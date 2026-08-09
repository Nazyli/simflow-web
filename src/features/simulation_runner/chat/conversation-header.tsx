import type { ChatConversation } from './types'

interface ConversationHeaderProps {
  conversation: ChatConversation | null
}

export function ConversationHeader({ conversation }: ConversationHeaderProps) {
  if (!conversation) {
    return (
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-500">
          ?
        </span>
        <p className="text-sm font-semibold text-slate-400">No conversation selected</p>
      </div>
    )
  }
  const count = conversation.messages.length
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#5b46c5] text-xs font-bold text-white">
        {conversation.actorName.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{conversation.actorName}</p>
        <p className="truncate text-xs text-slate-500">
          {count} message{count === 1 ? '' : 's'} · {conversation.actor}
        </p>
      </div>
    </div>
  )
}
