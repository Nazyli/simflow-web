import { Send } from 'lucide-react'
import type { FormEvent } from 'react'

interface MessageComposerProps {
  target: string
  disabled: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function MessageComposer({ target, disabled, onSubmit }: MessageComposerProps) {
  const canSend = Boolean(target) && !disabled
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 border-t border-slate-200 bg-white p-3">
      <input type="hidden" name="target" value={target} />
      <div className="flex items-end gap-2">
        <textarea
          name="content"
          required
          disabled={!canSend}
          placeholder={canSend ? `Message ${target}…` : 'Select a conversation to reply.'}
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
