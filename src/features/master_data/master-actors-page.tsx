import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Users } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { ApiError } from '../../shared/api/client'
import { getMasterActors, type MasterActor } from '../../shared/api/master-data'
import { RICH_TEXT_CLASS, SafeHtml } from '../../shared/safe-html'
import { renderActorPersonality } from './actor-crud-logic'
import { ActorCrudDialog } from './actor-crud-dialog'

const ACTOR_QUERY_KEY = ['master', 'actors']

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    try {
      const body = JSON.parse(error.message) as { info?: { message?: string } }
      return body.info?.message ?? error.message
    } catch {
      return error.message
    }
  }
  return error instanceof Error ? error.message : 'Unable to load actors.'
}

function scalar(value: string | null | undefined): string {
  return value?.trim() || '—'
}

export function MasterActorsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedActor, setSelectedActor] = useState<MasterActor | null>(null)
  const actorsQuery = useQuery({
    queryKey: ACTOR_QUERY_KEY,
    queryFn: getMasterActors,
  })

  function openCreate() {
    setSelectedActor(null)
    setDialogOpen(true)
  }

  function openEdit(actor: MasterActor) {
    setSelectedActor(actor)
    setDialogOpen(true)
  }

  const actors = actorsQuery.data ?? []

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-violet-600 uppercase">
            Master Data
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Actors</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the people and personalities available to your simulations.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus /> Add actor
        </Button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {actorsQuery.isPending && (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading actors...</div>
        )}
        {actorsQuery.isError && (
          <div className="px-6 py-12 text-center text-sm text-red-600">
            {errorMessage(actorsQuery.error)}
          </div>
        )}
        {!actorsQuery.isPending && !actorsQuery.isError && actors.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-600">
              <Users size={22} />
            </span>
            <h2 className="text-base font-semibold text-slate-800">No actors yet</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Add the first actor profile to use in chat, email, call, or AI workflows.
            </p>
            <Button type="button" className="mt-5" onClick={openCreate}>
              <Plus /> Add actor
            </Button>
          </div>
        )}
        {!actorsQuery.isPending && !actorsQuery.isError && actors.length > 0 && (
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>Actor ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead className="min-w-[280px]">Personality</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actors.map((actor) => (
                <TableRow key={actor.actorId}>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {actor.actorId}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">{actor.actorName}</TableCell>
                  <TableCell>{scalar(actor.actorEmail)}</TableCell>
                  <TableCell>{scalar(actor.actorPosition)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        actor.isParticipant
                          ? 'rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700'
                          : 'rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500'
                      }
                    >
                      {actor.isParticipant ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {actor.personaDesc?.trim() ? (
                      <SafeHtml
                        html={renderActorPersonality(actor.personaDesc)}
                        className={`${RICH_TEXT_CLASS} max-h-28 max-w-md overflow-auto rounded-lg bg-slate-50 px-3 py-2 text-xs`}
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit ${actor.actorName}`}
                      onClick={() => openEdit(actor)}
                    >
                      <Pencil /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <ActorCrudDialog open={dialogOpen} onOpenChange={setDialogOpen} actor={selectedActor} />
    </div>
  )
}
