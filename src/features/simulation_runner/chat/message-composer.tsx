import { Send, X } from 'lucide-react'
import type { FormEvent } from 'react'
import type { ChatMessage } from './types'

interface MessageComposerProps {
  target: string
  disabled: boolean
  quoteRequired?: boolean
  quotedMessage?: ChatMessage | null
  onClearQuote?: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function MessageComposer({ target, disabled, quoteRequired = false, quotedMessage = null, onClearQuote, onSubmit }: MessageComposerProps) {
  const canSend = Boolean(target) && !disabled
  const placeholder = quoteRequired ? 'Quote a message to choose which workflow this reply belongs to.' : canSend ? `Message ${target}…` : 'Select a conversation to reply.'
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 border-t border-slate-200 bg-white p-3">
      <input type="hidden" name="target" value={target} />
      {quotedMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs">
          <div className="min-w-0 flex-1">
            <span className="block font-semibold text-violet-800">{quotedMessage.workflow_label ?? quotedMessage.from ?? quotedMessage.actor ?? 'Message'}</span>
            <span className="block truncate text-violet-700">{quotedMessage.content ?? quotedMessage.action_type}</span>
          </div>
          {onClearQuote && (
            <button type="button" onClick={onClearQuote} aria-label="Clear quoted message" className="rounded p-0.5 text-violet-500 transition hover:bg-violet-100">
              <X size={14} />
            </button>
          )}
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          name="content"
          required
          disabled={!canSend}
          placeholder={placeholder}
          className="min-h-[44px] flex-1 resize-y rounded-lg !m-0 !border-slate-200 !bg-slate-50 !px-3 !py-2 text-sm text-slate-900 !shadow-none outline-none focus:!border-[#5b46c5] focus:!ring-2 focus:!ring-violet-200 disabled:!bg-slate-100"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="!m-0 !inline-flex shrink-0 items-center gap-1.5 rounded-lg !border-0 !bg-[#5b46c5] !px-3.5 !py-2 text-sm font-semibold !text-white shadow-sm transition hover:!bg-[#4b38ac] disabled:opacity-50"
        >
          <Send size={15} />
          Send
        </button>
      </div>
    </form>
  )
}
