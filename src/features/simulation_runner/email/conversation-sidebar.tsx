import { Mail, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { inputClass } from '../../../shared/form-classes'
import type { EmailInboxThread } from './types'
import { formatEmailDate } from './utils'

interface ConversationSidebarProps {
  threads: EmailInboxThread[]
  selectedRootId: string | null
  onSelect: (rootId: string) => void
}

export function ConversationSidebar({ threads, selectedRootId, onSelect }: ConversationSidebarProps) {
  const [search, setSearch] = useState('')
  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase()
    return query
      ? threads.filter(
          (thread) =>
            thread.latestSubject.toLowerCase().includes(query) ||
            thread.latestContent.toLowerCase().includes(query) ||
            thread.latestSenderId.toLowerCase().includes(query),
        )
      : threads
  }, [threads, search])
  return (
    <aside className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white p-2 lg:w-[280px] lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-2">
      <p className="hidden px-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase lg:block">
        Inbox
      </p>
      <label className="relative hidden px-1 pb-1 lg:block">
        <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-400" />
        <input
          className={`${inputClass} !py-2 !pl-8 text-xs`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search subject or sender"
        />
      </label>
      {filteredThreads.map((thread) => {
        const active = thread.rootId === selectedRootId
        return (
          <button
            key={thread.rootId}
            type="button"
            onClick={() => onSelect(thread.rootId)}
            className={`flex min-w-[220px] items-center gap-3 rounded-lg px-3 py-2.5 text-left lg:min-w-0 ${
              active
                ? '!border-0 !bg-violet-50 !text-[#5b46c5]'
                : '!border-0 !bg-transparent !text-slate-700 hover:!bg-slate-50'
            }`}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${active ? 'bg-[#5b46c5] text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              {thread.latestSenderId.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {thread.latestSubject || '(no subject)'}
                </span>
                {thread.unreadCount > 0 && (
                  <span
                    aria-label={`${thread.unreadCount} unread email${thread.unreadCount === 1 ? '' : 's'}`}
                    className="grid size-5 shrink-0 place-items-center rounded-full bg-violet-600 text-[10px] font-bold text-white"
                  >
                    {thread.unreadCount}
                  </span>
                )}
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-slate-500">
                  {thread.latestContent || 'No preview'}
                </span>
                <span className="shrink-0 text-[10px] text-slate-400">
                  {formatEmailDate(thread.latestCreatedDate)}
                </span>
              </span>
            </span>
          </button>
        )
      })}
      {filteredThreads.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
          <Mail size={18} className="text-slate-300" />
          <p className="text-xs text-slate-400">
            {threads.length ? 'No matching threads.' : 'No emails yet.'}
          </p>
        </div>
      )}
    </aside>
  )
}
