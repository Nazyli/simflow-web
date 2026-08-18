import { isOwnEmail, formatEmailTime } from './utils'
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
    <article className="border-b border-[#e8eaed] bg-white last:border-b-0">
      <div className="flex items-center gap-3 px-5 py-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: bgColor }}
        >
          {senderName.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-[#1a1a2e]">{senderName}</span>
          <time className="ml-1 text-xs text-[#5f6368]">
            {formatEmailTime(message.timestamp)}
            {message.workflow_label ? ` · ${message.workflow_label}` : ''}
          </time>
        </div>
        {isOwn && (
          <span className="text-[10px] font-medium text-[#5f6368] bg-[#f1f3f4] px-2 py-0.5 rounded-full">
            You
          </span>
        )}
      </div>

      <div className="px-5 pb-4">
        {message.subject && (
          <p className="mb-1.5 text-xs font-semibold text-[#5f6368]">
            {message.subject}
          </p>
        )}
        <p className="text-sm leading-relaxed text-[#1a1a2e] whitespace-pre-wrap">
          {message.content}
        </p>
      </div>

      {(message.to.length > 0 || message.cc.length > 0) && (
        <div className="px-5 pb-3 flex flex-wrap gap-x-4 gap-y-1">
          {message.to.length > 0 && (
            <span className="text-[11px] text-[#5f6368]">
              To: {message.to.join(', ')}
            </span>
          )}
          {message.cc.length > 0 && (
            <span className="text-[11px] text-[#5f6368]">
              Cc: {message.cc.join(', ')}
            </span>
          )}
        </div>
      )}
    </article>
  )
}
