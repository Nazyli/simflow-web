import { type FormEvent } from 'react'
import { Send } from 'lucide-react'

interface MessageComposerProps {
  target: string
  disabled: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function MessageComposer({ target, disabled, onSubmit }: MessageComposerProps) {
  const hasTarget = Boolean(target)

  return (
    <form
      className="border-t border-[#e8eaed] bg-white"
      onSubmit={onSubmit}
    >
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
          className="min-h-[36px] w-full rounded-lg border border-[#e8eaed] bg-[#f6f8fb] px-3 py-2 text-sm text-[#1a1a2e] outline-none transition-colors focus:border-[#5b46c5] focus:ring-2 focus:ring-violet-100 disabled:bg-[#f1f3f4] disabled:text-[#9aa0a6]"
        />

        <input
          type="text"
          name="subject"
          required
          disabled={disabled}
          placeholder={hasTarget ? 'Subject' : undefined}
          className="min-h-[36px] w-full rounded-lg border border-[#e8eaed] bg-[#f6f8fb] px-3 py-2 text-sm text-[#1a1a2e] outline-none transition-colors focus:border-[#5b46c5] focus:ring-2 focus:ring-violet-100 disabled:bg-[#f1f3f4] disabled:text-[#9aa0a6]"
        />

        <textarea
          name="content"
          required
          disabled={disabled}
          placeholder={hasTarget ? 'Write your reply...' : undefined}
          className="min-h-[80px] w-full resize-y rounded-lg border border-[#e8eaed] bg-[#f6f8fb] px-3 py-2 text-sm text-[#1a1a2e] outline-none transition-colors focus:border-[#5b46c5] focus:ring-2 focus:ring-violet-100 disabled:bg-[#f1f3f4] disabled:text-[#9aa0a6]"
        />

        <div className="flex justify-end pt-1">
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
