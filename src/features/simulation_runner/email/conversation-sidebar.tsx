import { Mail, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { inputClass } from '../../../shared/form-classes'
import type { EmailActor } from './types'

interface ConversationSidebarProps {
  actors: EmailActor[]
  selectedActor: string | null
  onSelect: (actor: string) => void
}

export function ConversationSidebar({ actors, selectedActor, onSelect }: ConversationSidebarProps) {
  const [search, setSearch] = useState('')
  const filteredActors = useMemo(() => {
    const query = search.trim().toLowerCase()
    return query
      ? actors.filter((actor) =>
          `${actor.actorName} ${actor.actorId}`.toLowerCase().includes(query),
        )
      : actors
  }, [actors, search])
  return (
    <aside className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white p-2 lg:w-[280px] lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-2">
      <p className="hidden px-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase lg:block">
        Contacts
      </p>
      <label className="relative hidden px-1 pb-1 lg:block">
        <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-400" />
        <input
          className={`${inputClass} !py-2 !pl-8 text-xs`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or actor ID"
        />
      </label>
      {filteredActors.map((actor) => {
        const active = actor.actorId === selectedActor
        return (
          <button
            key={actor.actorId}
            type="button"
            onClick={() => onSelect(actor.actorId)}
            className={`flex min-w-[220px] items-center gap-3 rounded-lg px-3 py-2.5 text-left lg:min-w-0 ${
              active
                ? '!border-0 !bg-violet-50 !text-[#5b46c5]'
                : '!border-0 !bg-transparent !text-slate-700 hover:!bg-slate-50'
            }`}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${active ? 'bg-[#5b46c5] text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              {actor.actorName.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold">{actor.actorName}</span>
                <span className="shrink-0 rounded-full bg-violet-100 px-1.5 text-[10px] font-semibold text-[#5b46c5]">
                  {actor.actorId}
                </span>
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-slate-500">{actor.actorId}</span>
                {actor.unreadCount > 0 ? (
                  <span
                    aria-label={`${actor.unreadCount} unread email${actor.unreadCount === 1 ? '' : 's'}`}
                    className="grid size-5 shrink-0 place-items-center rounded-full bg-violet-600 text-[10px] font-bold text-white"
                  >
                    {actor.unreadCount}
                  </span>
                ) : null}
              </span>
            </span>
          </button>
        )
      })}
      {filteredActors.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
          <Mail size={18} className="text-slate-300" />
          <p className="text-xs text-slate-400">
            {actors.length ? 'No matching contacts.' : 'No email contacts yet.'}
          </p>
        </div>
      )}
    </aside>
  )
}
