import { MessageSquare, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ChatConversation } from './types'
import { formatChatTime } from './utils'

interface ConversationSidebarProps {
  conversations: ChatConversation[]
  selectedActor: string | null
  onSelect: (actor: string) => void
}

export function ConversationSidebar({ conversations, selectedActor, onSelect }: ConversationSidebarProps) {
  const [search, setSearch] = useState('')
  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase()
    return query ? conversations.filter((conversation) => `${conversation.actorName} ${conversation.actor}`.toLowerCase().includes(query)) : conversations
  }, [conversations, search])
  return (
    <aside className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white p-2 lg:w-[280px] lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-2">
      <p className="hidden px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:block">Conversations</p>
      <label className="relative hidden px-1 pb-1 lg:block"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><input className="form-input !m-0 !w-full !py-2 !pl-8 text-xs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or actor ID" /></label>
      {filteredConversations.map((conversation) => {
        const active = conversation.actor === selectedActor
        return (
          <button
            key={conversation.actor}
            type="button"
            onClick={() => onSelect(conversation.actor)}
            className={`flex min-w-[220px] items-center gap-3 rounded-lg px-3 py-2.5 text-left lg:min-w-0 ${
              active
                ? '!border-0 !bg-violet-50 !text-[#5b46c5]'
                : '!border-0 !bg-transparent !text-slate-700 hover:!bg-slate-50'
            }`}
          >
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${active ? 'bg-[#5b46c5] text-white' : 'bg-slate-100 text-slate-500'}`}>
              {conversation.actorName.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold">{conversation.actorName} - {conversation.actor}</span>
                <time className="shrink-0 text-[10px] text-slate-400">{conversation.lastMessage ? formatChatTime(conversation.lastMessage.timestamp) : '—'}</time>
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-slate-500">{conversation.lastMessage ? conversation.lastMessage.content || conversation.lastMessage.action_type || 'Message' : 'No messages yet'}</span>
                {conversation.messages.length > 1 && (
                  <span className="shrink-0 rounded-full bg-violet-100 px-1.5 text-[10px] font-semibold text-[#5b46c5]">{conversation.messages.length}</span>
                )}
              </span>
            </span>
          </button>
        )
      })}
      {filteredConversations.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
          <MessageSquare size={18} className="text-slate-300" />
          <p className="text-xs text-slate-400">{conversations.length ? 'No matching conversations.' : 'No conversations yet.'}</p>
        </div>
      )}
    </aside>
  )
}
