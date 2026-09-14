import { type FormEvent } from 'react'
import { FileText, Paperclip, Send, X } from 'lucide-react'

import type { AttachmentSelection } from './attachment-picker-dialog'

interface MessageComposerProps {
  target: string
  disabled: boolean
  attachments: AttachmentSelection[]
  onOpenAttachmentPicker: () => void
  onRemoveAttachment: (participantDocId: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function formatPages(pages: { page: number | null }[]): string {
  return pages.map((page) => page.page ?? '—').join(', ')
}

export function MessageComposer({
  target,
  disabled,
  attachments,
  onOpenAttachmentPicker,
  onRemoveAttachment,
  onSubmit,
}: MessageComposerProps) {
  const hasTarget = Boolean(target)

  return (
    <form className="border-t border-[#e8eaed] bg-white" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2 pb-1">
          <span className="text-xs font-medium text-[#5f6368]">Reply to</span>
          <span className="text-xs font-semibold text-[#5b46c5]">{target}</span>
        </div>

        <input
          type="text"
          name="target"
          required
          disabled={!hasTarget || disabled}
          defaultValue={target}
          placeholder={hasTarget ? undefined : 'Select a conversation to reply'}
          className="min-h-[36px] w-full rounded-lg border border-[#e8eaed] bg-[#f6f8fb] px-3 py-2 text-sm text-[#1a1a2e] transition-colors outline-none focus:border-[#5b46c5] focus:ring-2 focus:ring-violet-100 disabled:bg-[#f1f3f4] disabled:text-[#9aa0a6]"
        />

        <input
          type="text"
          name="subject"
          required
          disabled={disabled}
          placeholder={hasTarget ? 'Subject' : undefined}
          className="min-h-[36px] w-full rounded-lg border border-[#e8eaed] bg-[#f6f8fb] px-3 py-2 text-sm text-[#1a1a2e] transition-colors outline-none focus:border-[#5b46c5] focus:ring-2 focus:ring-violet-100 disabled:bg-[#f1f3f4] disabled:text-[#9aa0a6]"
        />

        <textarea
          name="content"
          required
          disabled={disabled}
          placeholder={hasTarget ? 'Write your reply...' : undefined}
          className="min-h-[80px] w-full resize-y rounded-lg border border-[#e8eaed] bg-[#f6f8fb] px-3 py-2 text-sm text-[#1a1a2e] transition-colors outline-none focus:border-[#5b46c5] focus:ring-2 focus:ring-violet-100 disabled:bg-[#f1f3f4] disabled:text-[#9aa0a6]"
        />

        {attachments.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Attached documents">
            {attachments.map((attachment) => (
              <li
                key={attachment.participantDocId}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 py-1 pr-1.5 pl-2.5 text-xs text-[#1a1a2e]"
              >
                <FileText size={13} className="shrink-0 text-[#5b46c5]" />
                <span className="max-w-[220px] truncate font-medium">
                  {attachment.documentName}
                </span>
                <span className="text-[#5f6368]">(pages {formatPages(attachment.contents)})</span>
                <button
                  type="button"
                  aria-label={`Remove ${attachment.documentName}`}
                  disabled={disabled}
                  onClick={() => onRemoveAttachment(attachment.participantDocId)}
                  className="grid size-4 shrink-0 place-items-center rounded-full text-[#5f6368] transition-colors hover:bg-violet-100 hover:text-[#1a1a2e] disabled:opacity-50"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onOpenAttachmentPicker}
            disabled={!hasTarget || disabled}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8eaed] px-3 py-2 text-sm font-medium text-[#5f6368] transition-colors hover:border-[#5b46c5] hover:text-[#5b46c5] disabled:opacity-50"
          >
            <Paperclip size={15} />
            Attach
          </button>
          <button
            type="submit"
            disabled={!hasTarget || disabled}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#5b46c5] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#4b38ac] disabled:opacity-50"
          >
            <Send size={15} />
            Send
          </button>
        </div>
      </div>
    </form>
  )
}
