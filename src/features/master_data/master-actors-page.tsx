import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Users } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../../components/ui/button'
import { PageFrame } from '../../components/layout/page-frame'
import { PageHeader } from '../../components/layout/page-header'
import { SurfaceSection } from '../../components/layout/surface-section'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
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
import { hasActorPersonality, renderActorPersonality } from './actor-crud-logic'
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
  const [personalityActor, setPersonalityActor] = useState<MasterActor | null>(null)
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
    <PageFrame mode="operations" className="master-actors-page mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Master Data"
        title={
          <span className="flex min-w-0 items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700">
              <Users size={16} />
            </span>
            <span>Actors</span>
          </span>
        }
        description="Manage the people and personalities available to your simulations."
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus /> Add actor
          </Button>
        }
      />

      <SurfaceSection className="border-b-0 pb-0">
        {actorsQuery.isPending && (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading actors...</div>
        )}
        {actorsQuery.isError && (
          <div className="px-6 py-12 text-center text-sm text-red-600">
            {errorMessage(actorsQuery.error)}
          </div>
        )}
        {!actorsQuery.isPending && !actorsQuery.isError && actors.length === 0 && (
          <div className="px-5 py-10 text-left">
            <h2 className="text-base font-semibold text-slate-800">No actors yet</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Add the first actor profile to use in chat, email, call, or AI workflows.
            </p>
            <Button type="button" className="mt-4" onClick={openCreate}>
              <Plus /> Add actor
            </Button>
          </div>
        )}
        {!actorsQuery.isPending && !actorsQuery.isError && actors.length > 0 && (
          <div className="min-w-0 overflow-x-auto">
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
                    <TableCell className="font-semibold text-slate-800">
                      {actor.actorName}
                    </TableCell>
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
                      {hasActorPersonality(actor.personaDesc) ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                          onClick={() => setPersonalityActor(actor)}
                          aria-label={`View personality for ${actor.actorName}`}
                        >
                          View personality
                        </Button>
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
          </div>
        )}
      </SurfaceSection>

      <ActorCrudDialog open={dialogOpen} onOpenChange={setDialogOpen} actor={selectedActor} />

      <Dialog
        open={personalityActor !== null}
        onOpenChange={(open) => {
          if (!open) setPersonalityActor(null)
        }}
      >
        <DialogContent className="flex max-h-[min(680px,calc(100vh-32px))] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b px-6 pt-6 pb-4">
            <DialogTitle>{personalityActor?.actorName} · Personality</DialogTitle>
            <DialogDescription>Markdown personality for this actor.</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto px-6 py-5">
            {personalityActor && (
              <SafeHtml
                html={renderActorPersonality(personalityActor.personaDesc)}
                className={`${RICH_TEXT_CLASS} rounded-lg bg-slate-50 px-4 py-4`}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageFrame>
  )
}
