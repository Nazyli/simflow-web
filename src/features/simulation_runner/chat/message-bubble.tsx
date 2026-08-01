import type { ChatMessage } from './types'
import { formatChatTime, isOwnMessage } from './utils'

interface MessageBubbleProps {
  message: ChatMessage
  participantId: string
  quoted?: boolean
  onQuote?: (message: ChatMessage) => void
}

export function MessageBubble({ message, participantId, quoted = false, onQuote }: MessageBubbleProps) {
  const own = isOwnMessage(message, participantId)
  const sender = own ? 'You' : message.from || message.actor || 'system'
  const content = message.content || message.action_type || ''
  const interactive = Boolean(onQuote)
  return (
    <article className={`flex gap-2 ${own ? 'justify-end' : 'justify-start'}`}>
      {!own && (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
          {sender.slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="max-w-[75%] min-w-0">
        <div className={`flex items-baseline gap-2 px-1 ${own ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] font-semibold text-slate-500">{sender}</span>
          <time className="text-[10px] text-slate-400">{formatChatTime(message.timestamp)}</time>
          {message.workflow_version_id && <span className="text-[10px] text-slate-400">| {message.workflow_version_id.slice(0, 3)}</span>}
        </div>
        <button
          type="button"
          disabled={!interactive}
          onClick={onQuote ? () => onQuote(message) : undefined}
          className={`[font-family:inherit] mt-0.5 block max-w-full whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed ${own ? 'rounded-br-md bg-[#5b46c5] text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'} ${interactive ? 'cursor-pointer transition hover:ring-2 hover:ring-violet-300' : ''} ${quoted ? 'ring-2 ring-[#5b46c5]' : ''}`}
        >
          {content}
        </button>
      </div>
    </article>
  )
}
