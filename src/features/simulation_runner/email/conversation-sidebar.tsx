import { Mail, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { inputClass } from '../../../shared/form-classes'
import type { EmailInboxThread } from './types'
import { formatEmailDate } from './utils'

const AVATAR_COLORS = [
  '#5b46c5',
  '#039be5',
  '#0b8043',
  '#d50000',
  '#f4511e',
  '#8e24aa',
  '#00897b',
  '#616161',
]

function avatarBg(senderId: string): string {
  return AVATAR_COLORS[senderId.charCodeAt(0) % AVATAR_COLORS.length]
}

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
    <aside className="flex shrink-0 flex-col border-b border-[#e8eaed] bg-white lg:w-[320px] lg:border-b-0 lg:border-r">
      <p className="px-4 pt-3 pb-2 text-[10px] font-bold tracking-wider text-[#9aa0a6] uppercase">
        Inbox
      </p>
      <label className="relative px-3 pb-2">
        <Search className="pointer-events-none absolute top-2.5 left-6 h-3.5 w-3.5 text-[#9aa0a6]" />
        <input
          className={`${inputClass} !py-2 !pl-8 text-xs`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search emails"
        />
      </label>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredThreads.map((thread) => {
          const active = thread.rootId === selectedRootId
          const unread = thread.unreadCount > 0
          return (
            <button
              key={thread.rootId}
              type="button"
              onClick={() => onSelect(thread.rootId)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[#e8eaed] last:border-b-0 hover:bg-[#f1f3f4] ${
                active ? 'bg-[#e8f0fe]' : 'bg-white'
              }`}
            >
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: avatarBg(thread.latestSenderId) }}
              >
                {thread.latestSenderId.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={`truncate text-sm ${
                      unread ? 'font-semibold text-[#1a1a2e]' : 'font-normal text-[#5f6368]'
                    }`}
                  >
                    {thread.latestSubject || '(no subject)'}
                  </span>
                  <span className="shrink-0 text-[11px] text-[#5f6368]">
                    {formatEmailDate(thread.latestCreatedDate)}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-[#5f6368]">
                    {thread.latestContent || 'No preview'}
                  </span>
                  {unread && (
                    <span
                      aria-label={`${thread.unreadCount} unread email${thread.unreadCount === 1 ? '' : 's'}`}
                      className="shrink-0 rounded-full bg-[#5b46c5] px-1.5 text-[10px] font-bold leading-4 text-center text-white min-w-[18px]"
                    >
                      {thread.unreadCount}
                    </span>
                  )}
                </span>
              </span>
            </button>
          )
        })}
        {filteredThreads.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Mail size={20} className="text-[#9aa0a6]" />
            <p className="text-xs text-[#5f6368]">
              {threads.length ? 'No matching threads.' : 'No emails yet.'}
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
