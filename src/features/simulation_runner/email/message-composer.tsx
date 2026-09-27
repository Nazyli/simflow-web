import { useState, type FormEvent } from 'react'
import { FileText, Paperclip, Send, X } from 'lucide-react'

import type { AttachmentSelection } from './attachment-picker-dialog'
import { MasterPickerDialog } from '../../simulation_studio/pickers/master-picker-dialog'
import { formatReplySubject } from './utils'

interface MessageComposerProps {
  target: string
  subject: string
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
  subject: latestSubject,
  disabled,
  attachments,
  onOpenAttachmentPicker,
  onRemoveAttachment,
  onSubmit,
}: MessageComposerProps) {
  const [recipient, setRecipient] = useState(target)
  const [subject, setSubject] = useState(formatReplySubject(latestSubject))
  const [actorPickerOpen, setActorPickerOpen] = useState(false)
  const hasTarget = Boolean(recipient.trim())

  return (
    <form className="min-w-0 border-t border-slate-200 bg-white" onSubmit={onSubmit}>
      <div className="flex min-w-0 flex-col gap-2 p-3">
        <div className="flex items-center gap-2 pb-1">
          <span className="text-xs font-medium text-slate-500">Reply to</span>
          <span className="text-primary text-xs font-semibold">{recipient}</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            name="target"
            required
            disabled={disabled}
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder={hasTarget ? undefined : 'Select a conversation to reply'}
            className="focus:border-primary focus:ring-primary/15 min-h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-[var(--color-canvas)] px-3 py-2 text-sm text-slate-900 transition-colors outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => setActorPickerOpen(true)}
            className="hover:border-primary hover:text-primary min-h-9 shrink-0 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition-colors disabled:opacity-50"
          >
            Pick actor
          </button>
        </div>

        <input
          type="text"
          name="subject"
          required
          disabled={disabled}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder={hasTarget ? 'Subject' : undefined}
          className="focus:border-primary focus:ring-primary/15 min-h-9 w-full rounded-md border border-slate-200 bg-[var(--color-canvas)] px-3 py-2 text-sm text-slate-900 transition-colors outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400"
        />

        <textarea
          name="content"
          required
          disabled={disabled}
          placeholder={hasTarget ? 'Write your reply...' : undefined}
          className="focus:border-primary focus:ring-primary/15 min-h-[72px] w-full resize-y rounded-md border border-slate-200 bg-[var(--color-canvas)] px-3 py-2 text-sm text-slate-900 transition-colors outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400"
        />

        {attachments.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Attached documents">
            {attachments.map((attachment) => (
              <li
                key={attachment.participantDocId}
                className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 py-1 pr-1.5 pl-2.5 text-xs text-slate-900"
              >
                <FileText size={13} className="text-primary shrink-0" />
                <span className="max-w-[220px] truncate font-medium">
                  {attachment.documentName}
                </span>
                <span className="text-slate-500">(pages {formatPages(attachment.contents)})</span>
                <button
                  type="button"
                  aria-label={`Remove ${attachment.documentName}`}
                  disabled={disabled}
                  onClick={() => onRemoveAttachment(attachment.participantDocId)}
                  className="grid size-4 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-violet-100 hover:text-slate-900 disabled:opacity-50"
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
            className="hover:border-primary hover:text-primary inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition-colors disabled:opacity-50"
          >
            <Paperclip size={15} />
            Attach
          </button>
          <button
            type="submit"
            disabled={!hasTarget || disabled}
            className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Send size={15} />
            Send
          </button>
        </div>
      </div>
      <MasterPickerDialog
        open={actorPickerOpen}
        onOpenChange={setActorPickerOpen}
        title="Pick actor"
        resource="actors"
        endpoint="/admin/master-data/actors"
        displayFields={['actorId', 'actorName', 'actorEmail']}
        valueField="actorId"
        selected={recipient}
        onSelect={(record) => setRecipient(String(record.actorId ?? ''))}
      />
    </form>
  )
}
