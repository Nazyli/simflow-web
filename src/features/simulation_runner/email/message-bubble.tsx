import { isOwnEmail, formatEmailDate } from './utils'
import type { EmailMessage } from './types'

interface MessageBubbleProps {
  message: EmailMessage
  participantId: string
}

function avatarColor(message: EmailMessage, participantId: string): string {
  return isOwnEmail(message, participantId) ? '#039be5' : '#5b46c5'
}

export function MessageBubble({ message, participantId }: MessageBubbleProps) {
  const isOwn = isOwnEmail(message, participantId)
  const bgColor = avatarColor(message, participantId)

  const senderName = message.from || message.actor || 'Unknown'

  return (
    <article className="bg-white border-t border-slate-200">
      {/* Subject */}
      <div className="px-5 pt-4 pb-1.5">
        <h2 className="text-base font-semibold leading-snug text-slate-600">
          {message.subject || '(No subject)'}
        </h2>
      </div>

      {/* Header metadata */}
      <div className="px-5 pb-3">
        {/* From + To/Cc rows */}
        <div className="flex gap-3">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-medium text-white"
            style={{ backgroundColor: bgColor }}
          >
            {senderName.charAt(0).toUpperCase()}
          </span>
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">
                {senderName}
              </span>
              {isOwn && (
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
              {message.workflow_label && (
                <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {message.workflow_label}
                </span>
              )}
              <time className="ml-auto text-xs text-slate-400 shrink-0">
                {formatEmailDate(message.timestamp)}
              </time>
            </div>
            {message.to.length > 0 && (
              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-600">To:</span>{' '}
                {message.to.join(', ')}
              </div>
            )}
            {message.cc.length > 0 && (
              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-600">Cc:</span>{' '}
                {message.cc.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <p className="text-[13px] leading-[1.7] text-slate-700 whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </article>
  )
}
