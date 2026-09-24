import type { ChatMessage } from './types'
import { formatChatTime, isOwnMessage, splitMessageLinks } from './utils'

interface MessageBubbleProps {
  message: ChatMessage
  participantId: string
}

function isSameOrigin(url: string): boolean {
  try {
    return new URL(url, window.location.origin).origin === window.location.origin
  } catch {
    return false
  }
}

export function MessageBubble({ message, participantId }: MessageBubbleProps) {
  const own = isOwnMessage(message, participantId)
  const sender = own ? 'You' : message.from || message.actor || 'system'
  const content = message.content || message.actionType || ''
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
          {message.simulationLabel && (
            <span className="truncate text-[10px] text-slate-400">| {message.simulationLabel}</span>
          )}
        </div>
        <div
          className={`mt-0.5 block max-w-full rounded-lg px-3.5 py-2 text-left text-sm leading-relaxed break-words whitespace-pre-wrap ${
            own
              ? 'rounded-br-md bg-[#9929EA] text-white'
              : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
          }`}
        >
          {splitMessageLinks(content).map((segment, index) =>
            segment.url ? (
              isSameOrigin(segment.url) ? (
                <a key={index} href={segment.url} className="break-all underline">
                  {segment.text}
                </a>
              ) : (
                <a
                  key={index}
                  href={segment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all underline"
                >
                  {segment.text}
                </a>
              )
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </div>
      </div>
    </article>
  )
}
