import { Send } from 'lucide-react'
import type { FormEvent } from 'react'

interface MessageComposerProps {
  target: string
  disabled: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function MessageComposer({ target, disabled, onSubmit }: MessageComposerProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 border-t border-slate-200 bg-white p-3"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <label
            htmlFor="email-target"
            className="shrink-0 text-xs font-medium text-slate-500"
          >
            To
          </label>
          <input
            id="email-target"
            type="text"
            name="target"
            required
            defaultValue={target}
            disabled={!target || disabled}
            placeholder={target ? undefined : 'Select a conversation to reply.'}
            className="!m-0 min-h-[36px] flex-1 resize-none rounded-lg !border-slate-200 !bg-slate-50 !px-3 !py-1.5 text-sm font-semibold text-[#5b46c5] !shadow-none outline-none focus:!border-[#5b46c5] focus:!ring-2 focus:!ring-violet-200 disabled:!bg-slate-100 disabled:text-slate-400"
          />
        </div>
        <input
          type="text"
          name="subject"
          required
          disabled={!target || disabled}
          placeholder={target ? 'Subject' : 'Select a conversation to reply.'}
          className="!m-0 min-h-[36px] flex-1 resize-none rounded-lg !border-slate-200 !bg-slate-50 !px-3 !py-2 text-sm text-slate-900 !shadow-none outline-none focus:!border-[#5b46c5] focus:!ring-2 focus:!ring-violet-200 disabled:!bg-slate-100"
        />
        <div className="flex items-end gap-2">
          <textarea
            name="content"
            required
            disabled={!target || disabled}
            placeholder={target ? 'Write a reply…' : 'Select a conversation to reply.'}
            className="!m-0 min-h-[44px] flex-1 resize-y rounded-lg !border-slate-200 !bg-slate-50 !px-3 !py-2 text-sm text-slate-900 !shadow-none outline-none focus:!border-[#5b46c5] focus:!ring-2 focus:!ring-violet-200 disabled:!bg-slate-100"
          />
          <button
            type="submit"
            disabled={!target || disabled}
            className="!m-0 !inline-flex shrink-0 items-center gap-1.5 rounded-lg !border-0 !bg-[#5b46c5] !px-3.5 !py-2 text-sm font-semibold !text-white shadow-sm transition hover:!bg-[#4b38ac] disabled:opacity-50"
          >
            <Send size={15} />
            Send
          </button>
        </div>
      </div>
    </form>
  )
}
