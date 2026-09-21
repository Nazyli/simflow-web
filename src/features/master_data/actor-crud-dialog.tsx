import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'

import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Checkbox } from '../../components/ui/checkbox'
import { ApiError } from '../../shared/api/client'
import {
  createMasterActor,
  deleteMasterActor,
  updateMasterActor,
  type MasterActor,
} from '../../shared/api/master-data'
import {
  actorFormFromRecord,
  emptyActorForm,
  validateActorForm,
  type ActorFormValues,
} from './actor-crud-logic'

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
  return error instanceof Error ? error.message : 'Unable to save actor.'
}

export function ActorCrudDialog({
  open,
  onOpenChange,
  actor,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  actor: MasterActor | null
}) {
  const queryClient = useQueryClient()
  const editing = actor !== null
  const [form, setForm] = useState<ActorFormValues>(emptyActorForm)
  const saveMutation = useMutation({
    mutationFn: (values: ActorFormValues) =>
      editing ? updateMasterActor(actor.actorId, values) : createMasterActor(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACTOR_QUERY_KEY })
      onOpenChange(false)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteMasterActor,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACTOR_QUERY_KEY })
      onOpenChange(false)
    },
  })
  const resetSaveMutation = saveMutation.reset
  const resetDeleteMutation = deleteMutation.reset
  const formError = validateActorForm(form, editing)

  useEffect(() => {
    if (!open) return
    setForm(actor ? actorFormFromRecord(actor) : emptyActorForm())
    resetSaveMutation()
    resetDeleteMutation()
  }, [actor, open, resetDeleteMutation, resetSaveMutation])

  function updateField<K extends keyof ActorFormValues>(field: K, value: ActorFormValues[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit() {
    if (formError || saveMutation.isPending || deleteMutation.isPending) return
    saveMutation.mutate(form)
  }

  function deleteCurrentActor() {
    if (!actor || saveMutation.isPending || deleteMutation.isPending) return
    if (window.confirm(`Delete actor "${actor.actorName}"?`)) {
      deleteMutation.mutate(actor.actorId)
    }
  }

  const busy = saveMutation.isPending || deleteMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(760px,calc(100vh-32px))] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle>{editing ? 'Edit actor' : 'Add actor'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update the actor profile used by simulations and conversations.'
              : 'Create an actor profile that can be selected in simulation nodes.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 overflow-auto px-6 py-5">
          <div className="grid gap-1.5">
            <Label htmlFor="master-actor-id">Actor ID</Label>
            <Input
              id="master-actor-id"
              value={form.actorId}
              disabled={editing || busy}
              placeholder="actor-coach-01"
              onChange={(event) => updateField('actorId', event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              {editing ? 'Actor IDs cannot be changed after creation.' : 'Use a stable unique ID.'}
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="master-actor-name">Name</Label>
            <Input
              id="master-actor-name"
              value={form.actorName}
              disabled={busy}
              placeholder="Risa Dewanti"
              onChange={(event) => updateField('actorName', event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="master-actor-email">Email</Label>
              <Input
                id="master-actor-email"
                type="email"
                value={form.actorEmail}
                disabled={busy}
                placeholder="risa@example.com"
                onChange={(event) => updateField('actorEmail', event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="master-actor-position">Position</Label>
              <Input
                id="master-actor-position"
                value={form.actorPosition}
                disabled={busy}
                placeholder="Coach"
                onChange={(event) => updateField('actorPosition', event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="master-actor-group-position">Group Position</Label>
            <Input
              id="master-actor-group-position"
              value={form.actorGroupPosition}
              disabled={busy}
              placeholder="People Development"
              onChange={(event) => updateField('actorGroupPosition', event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="master-actor-personality">Personality Markdown</Label>
            <Textarea
              id="master-actor-personality"
              rows={8}
              value={form.personaDesc}
              disabled={busy}
              placeholder="# Communication style\n- Warm\n- Clear"
              onChange={(event) => updateField('personaDesc', event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Markdown is rendered in the actor table and used as the actor personality.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox
              checked={form.isParticipant}
              disabled={busy}
              onCheckedChange={(checked) => updateField('isParticipant', checked === true)}
            />
            Available as participant actor
          </label>

          {formError && <p className="text-destructive text-xs">{formError}</p>}
          {saveMutation.error && (
            <p className="text-destructive text-xs">{errorMessage(saveMutation.error)}</p>
          )}
          {deleteMutation.error && (
            <p className="text-destructive text-xs">{errorMessage(deleteMutation.error)}</p>
          )}

          <DialogFooter className="px-0">
            {editing && (
              <Button
                type="button"
                variant="destructive"
                className="mr-auto"
                disabled={busy}
                onClick={deleteCurrentActor}
              >
                <Trash2 /> Delete actor
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={Boolean(formError) || busy} onClick={submit}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Save changes' : 'Create actor'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
