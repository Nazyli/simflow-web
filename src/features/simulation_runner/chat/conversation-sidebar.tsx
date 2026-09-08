import { MessageSquare, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { inputClass } from '../../../shared/form-classes'
import { getMasterActors } from '../../../shared/api/chat'
import type { ChatActor } from './types'

interface ConversationSidebarProps {
  actors: ChatActor[]
  selectedActor: string | null
  onSelect: (actor: string) => void
  onStartNewChat?: (actor: ChatActor) => void
}

export function ConversationSidebar({
  actors,
  selectedActor,
  onSelect,
  onStartNewChat,
}: ConversationSidebarProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [dialogSearch, setDialogSearch] = useState('')

  const filteredActors = useMemo(() => {
    const query = search.trim().toLowerCase()
    return query
      ? actors.filter((actor) =>
          `${actor.actorName} ${actor.actorId}`.toLowerCase().includes(query),
        )
      : actors
  }, [actors, search])

  const actorIdsInSidebar = useMemo(() => new Set(actors.map((a) => a.actorId)), [actors])

  const masterQuery = useQuery({
    queryKey: ['master-actors'],
    queryFn: getMasterActors,
    enabled: open,
  })

  const availableActors = useMemo(() => {
    const list = masterQuery.data ?? []
    return list.filter((item) => !actorIdsInSidebar.has(item.actor_id))
  }, [masterQuery.data, actorIdsInSidebar])

  const filteredMaster = useMemo(() => {
    const query = dialogSearch.trim().toLowerCase()
    if (!query) return availableActors
    return availableActors.filter((item) =>
      `${item.actor_name} ${item.actor_id}`.toLowerCase().includes(query),
    )
  }, [availableActors, dialogSearch])

  function handlePick(actorId: string, actorName: string) {
    const optimistic: ChatActor = { actorId, actorName, unreadCount: 0 }
    setOpen(false)
    setDialogSearch('')
    if (onStartNewChat) onStartNewChat(optimistic)
    else onSelect(optimistic.actorId)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setDialogSearch('')
  }

  return (
    <>
      <aside className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white p-2 lg:w-[280px] lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-2">
        <p className="hidden px-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase lg:block">
          Conversations
        </p>
        <div className="hidden items-center gap-2 px-1 pb-1 lg:flex">
          <label className="relative flex-1">
            <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-400" />
            <input
              className={`${inputClass} !py-2 !pl-8 text-xs`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or actor ID"
            />
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="shrink-0 gap-1"
          >
            <Plus className="size-3.5" />
            New Chat
          </Button>
        </div>
        {/* Mobile: search + new chat row visible on small screens as stacked or inline */}
        <div className="flex items-center gap-2 px-1 pb-1 lg:hidden">
          <label className="relative flex-1">
            <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-400" />
            <input
              className={`${inputClass} !py-2 !pl-8 text-xs`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
            />
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="shrink-0 gap-1"
          >
            <Plus className="size-3.5" />
            New Chat
          </Button>
        </div>
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
                      aria-label={`${actor.unreadCount} unread message${actor.unreadCount === 1 ? '' : 's'}`}
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
            <MessageSquare size={18} className="text-slate-300" />
            <p className="text-xs text-slate-400">
              {actors.length ? 'No matching conversations.' : 'No conversations yet.'}
            </p>
          </div>
        )}
      </aside>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[min(560px,85vh)] flex-col p-0 sm:max-w-md">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle>New Chat</DialogTitle>
            <DialogDescription>Pilih actor untuk memulai percakapan baru.</DialogDescription>
          </DialogHeader>
          <div className="px-6">
            <label className="relative block">
              <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={dialogSearch}
                onChange={(e) => setDialogSearch(e.target.value)}
                placeholder="Cari nama atau actor ID"
                className="pl-8"
              />
            </label>
          </div>
          <div className="min-h-[240px] flex-1 overflow-y-auto px-2 pb-4">
            {masterQuery.isLoading ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <p className="text-xs text-slate-400">Memuat actors...</p>
              </div>
            ) : availableActors.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <MessageSquare size={18} className="text-slate-300" />
                <p className="text-xs text-slate-400">No actors available</p>
                <p className="text-[11px] text-slate-400">Semua actor sudah memiliki percakapan.</p>
              </div>
            ) : filteredMaster.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <MessageSquare size={18} className="text-slate-300" />
                <p className="text-xs text-slate-400">Tidak ada actor cocok</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 px-2">
                {filteredMaster.map((item) => (
                  <button
                    key={item.actor_id}
                    type="button"
                    onClick={() => handlePick(item.actor_id, item.actor_name)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                      {item.actor_name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-700">
                          {item.actor_name}
                        </span>
                        <span className="shrink-0 rounded-full bg-violet-100 px-1.5 text-[10px] font-semibold text-[#5b46c5]">
                          {item.actor_id}
                        </span>
                      </span>
                      <span className="truncate text-xs text-slate-500">{item.actor_id}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {masterQuery.isError ? (
              <p className="px-6 pt-2 text-xs text-red-500">Gagal memuat daftar actor.</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
