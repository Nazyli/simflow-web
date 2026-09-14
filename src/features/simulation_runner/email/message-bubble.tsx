import { useMemo } from 'react'
import { Check, FileText, LoaderCircle } from 'lucide-react'
import { isOwnEmail, formatEmailDate } from './utils'
import { isHtmlContent, sanitizeEmailHtml } from './sanitize'
import { type EmailAttachment, type EmailMessage, formatAttachmentPageLabel } from './types'

interface MessageBubbleProps {
  message: EmailMessage
  participantId: string
  openingAttachmentIds: ReadonlySet<string>
  onOpenAttachment: (message: EmailMessage, attachment: EmailAttachment) => void
}

function avatarColor(message: EmailMessage, participantId: string): string {
  return isOwnEmail(message, participantId) ? '#039be5' : '#5b46c5'
}

export function MessageBubble({
  message,
  participantId,
  openingAttachmentIds,
  onOpenAttachment,
}: MessageBubbleProps) {
  const isOwn = isOwnEmail(message, participantId)
  const bgColor = avatarColor(message, participantId)

  const senderName = message.from || message.actor || 'Unknown'

  const renderedBody = useMemo(() => {
    if (!isHtmlContent(message.content)) return null
    return sanitizeEmailHtml(message.content)
  }, [message.content])

  return (
    <article className="border-t border-slate-200 bg-white">
      {/* Subject */}
      <div className="px-5 pt-4 pb-1.5">
        <h2 className="text-base leading-snug font-semibold text-slate-600">
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
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">{senderName}</span>
              {isOwn && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  You
                </span>
              )}
              {message.simulationLabel && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                  {message.simulationLabel}
                </span>
              )}
              <time className="ml-auto shrink-0 text-xs text-slate-400">
                {formatEmailDate(message.timestamp)}
              </time>
            </div>
            {message.to.length > 0 && (
              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-600">To:</span> {message.to.join(', ')}
              </div>
            )}
            {message.cc.length > 0 && (
              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-600">Cc:</span> {message.cc.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {renderedBody ? (
          <div
            className="text-[13px] leading-[1.7] break-words text-slate-700 [&_a]:text-indigo-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-[15px] [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_table]:w-full [&_table]:text-xs [&_td]:border [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-2 [&_th]:py-1"
            dangerouslySetInnerHTML={{ __html: renderedBody }}
          />
        ) : (
          <p className="text-[13px] leading-[1.7] whitespace-pre-wrap text-slate-700">
            {message.content}
          </p>
        )}
      </div>
      {message.attachments.length ? (
        <div className="border-t border-slate-100 px-5 py-3">
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Attachments
          </p>
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((attachment) => {
              const isOpened = Boolean(attachment.openedAt)
              const isOpening = openingAttachmentIds.has(attachment.emailAttachmentId)
              const pageLabel = formatAttachmentPageLabel(attachment.contents)
              return (
                <button
                  key={attachment.emailAttachmentId}
                  type="button"
                  disabled={isOpening}
                  onClick={() => onOpenAttachment(message, attachment)}
                  className="inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-default disabled:opacity-70"
                >
                  {isOpening ? (
                    <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                  ) : isOpened ? (
                    <Check className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <FileText className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
                  )}
                  <span className="truncate">{attachment.fileName ?? 'Attachment'}</span>
                  {pageLabel ? <span className="shrink-0 text-slate-400">{pageLabel}</span> : null}
                  {isOpened ? <span className="text-emerald-700">Opened</span> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </article>
  )
}
