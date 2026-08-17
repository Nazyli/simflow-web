import type { EmailMessage } from './types'
import { formatEmailTime, isOwnEmail } from './utils'

interface MessageBubbleProps {
  message: EmailMessage
  participantId: string
}

export function MessageBubble({ message, participantId }: MessageBubbleProps) {
  const own = isOwnEmail(message, participantId)
  const sender = own ? 'You' : message.from || message.actor || 'system'
  const subject = message.subject || ''
  const content = message.content || ''
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
          <time className="text-[10px] text-slate-400">{formatEmailTime(message.timestamp)}</time>
          {message.workflow_label && (
            <span className="truncate text-[10px] text-slate-400">| {message.workflow_label}</span>
          )}
        </div>
        <div
          className={`mt-0.5 block max-w-full rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed break-words whitespace-pre-wrap ${
            own
              ? 'rounded-br-md bg-[#5b46c5] text-white'
              : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
          }`}
        >
          {subject && (
            <p className={`mb-1 text-xs font-semibold ${own ? 'text-violet-200' : 'text-slate-600'}`}>
              {subject}
            </p>
          )}
          <p>{content}</p>
        </div>
        {(message.to.length > 0 || message.cc.length > 0) && (
          <div className={`flex items-center gap-2 px-1 mt-0.5 ${own ? 'justify-end' : 'justify-start'}`}>
            {message.to.length > 0 && (
              <span className="text-[10px] text-slate-400">
                To: {message.to.join(', ')}
              </span>
            )}
            {message.cc.length > 0 && (
              <span className="text-[10px] text-slate-400">
                Cc: {message.cc.join(', ')}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
