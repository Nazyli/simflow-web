import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderKanban, Layers, Lock, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { ApiError } from '../../shared/api/client'
import {
  createGroupSimulation,
  createSimulation,
  deleteGroupSimulation,
  getGroupSimulations,
  updateGroupSimulation,
} from '../../shared/api/simulations'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/async-state'
import type { GroupSimulation, Simulation } from '../../shared/types/simulation'

function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    try {
      const info = JSON.parse(error.message).info
      if (typeof info?.message === 'string') return info.message
    } catch {
      // fall through to raw message
    }
    return error.message
  }
  return error instanceof Error ? error.message : 'Unknown error.'
}

function bestSimulation(group: GroupSimulation): Simulation | undefined {
  const sims = group.simulations ?? []
  return sims[0]
}

export function SimulationListPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [pickerGroup, setPickerGroup] = useState<GroupSimulation | null>(null)
  const [formGroup, setFormGroup] = useState<GroupSimulation | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GroupSimulation | null>(null)

  const groups = useQuery({ queryKey: ['group-simulations'], queryFn: getGroupSimulations })

  const create = useMutation({
    mutationFn: async (
      payload: Pick<GroupSimulation, 'groupSimulationName' | 'groupSimulationDesc'> & {
        simulationName: string
        channelName: string
        duration: number
      },
    ) => {
      const group = await createGroupSimulation({
        groupSimulationName: payload.groupSimulationName,
        groupSimulationDesc: payload.groupSimulationDesc,
      })
      const simulation = await createSimulation(group.groupSimulationId, {
        simulationName: payload.simulationName,
        simulationDesc: null,
        channelName: payload.channelName,
        duration: payload.duration,
      })
      return { group, simulation }
    },
    onSuccess: ({ simulation }) => {
      queryClient.invalidateQueries({ queryKey: ['group-simulations'] })
      setFormGroup(null)
      navigate(`/studio/${simulation.simulationId}`)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Pick<GroupSimulation, 'groupSimulationName' | 'groupSimulationDesc'>
    }) => updateGroupSimulation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-simulations'] })
      setFormGroup(null)
      toast.success('Simulation group updated.')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const remove = useMutation({
    mutationFn: deleteGroupSimulation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-simulations'] })
      setDeleteTarget(null)
      toast.success('Simulation group deleted.')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const bootstrapSimulation = useMutation({
    mutationFn: (groupSimulationId: string) =>
      createSimulation(groupSimulationId, {
        simulationName: 'Simulation 1',
        simulationDesc: null,
        channelName: 'chat',
        duration: 60,
      }),
    onSuccess: (simulation) => {
      queryClient.invalidateQueries({ queryKey: ['group-simulations'] })
      navigate(`/studio/${simulation.simulationId}`)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  function openGroup(group: GroupSimulation) {
    const sims = group.simulations ?? []
    if (sims.length === 0) {
      bootstrapSimulation.mutate(group.groupSimulationId)
      return
    }
    if (sims.length === 1) {
      navigate(`/studio/${sims[0].simulationId}`)
      return
    }
    setPickerGroup(group)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const groupName = String(form.get('name'))
    const groupDesc = String(form.get('description')) || null
    const simulationName = String(form.get('simulationName') || groupName)
    const channelName = String(form.get('channelName') || 'chat')
    const duration = Number(form.get('duration') || 60)
    if (formGroup && formGroup !== 'new') {
      update.mutate({
        id: formGroup.groupSimulationId,
        payload: { groupSimulationName: groupName, groupSimulationDesc: groupDesc },
      })
    } else {
      create.mutate({
        groupSimulationName: groupName,
        groupSimulationDesc: groupDesc,
        simulationName: simulationName,
        channelName: channelName,
        duration,
      })
    }
  }

  const editing = formGroup && formGroup !== 'new' ? formGroup : null
  const pickerBest = pickerGroup ? bestSimulation(pickerGroup) : undefined

  return (
    <main className="simulation-list-page min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="brand-gradient grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-sm">
            <FolderKanban size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-purple-700 uppercase">
              Simulation Builder
            </p>
            <h1 className="truncate text-lg font-bold text-slate-900">Simulations</h1>
            <p className="truncate text-xs text-slate-500">
              Open a simulation in the builder, or create a new simulation group.
            </p>
          </div>
        </div>
        <Button type="button" onClick={() => setFormGroup('new')}>
          <Plus className="h-4 w-4" /> New Simulation
        </Button>
      </header>

      {groups.isPending && <LoadingState variant="runner" />}
      {groups.isError && <ErrorState message="Unable to load simulations." />}

      {groups.data && groups.data.length === 0 && (
        <EmptyState
          title="No simulations yet"
          description="Create your first simulation group to start building scenarios with nodes, ports, and edges."
          action={
            <Button type="button" onClick={() => setFormGroup('new')}>
              <Plus className="h-4 w-4" /> Create your first simulation
            </Button>
          }
        />
      )}

      {groups.data && groups.data.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {groups.data.map((group) => {
            const sims = group.simulations ?? []
            const lockedCount = sims.filter((s) => s.isLocked).length
            const primarySim = sims[0]
            return (
              <article
                key={group.groupSimulationId}
                className="group relative flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition-colors hover:border-[#DBABFF] hover:shadow-md"
              >
                <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={`Edit ${group.groupSimulationName}`}
                    title="Edit simulation details"
                    className="rounded-md bg-white/90 p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => setFormGroup(group)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${group.groupSimulationName}`}
                    title="Delete simulation"
                    className="rounded-md bg-white/90 p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    onClick={() => setDeleteTarget(group)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  className="flex flex-1 flex-col gap-1.5 p-3 pr-24 text-left"
                  onClick={() => openGroup(group)}
                >
                  <div className="flex w-full items-center gap-2">
                    <h2 className="line-clamp-2 text-xs leading-4 font-semibold tracking-[-0.005em] text-slate-900">
                      {group.groupSimulationName}
                    </h2>
                  </div>
                  <p className="truncate text-[11px] leading-4 text-slate-500">
                    {group.groupSimulationDesc || 'No description provided.'}
                  </p>
                  <div className="flex min-w-0 flex-wrap items-center gap-2 pt-0.5 text-[10px] font-medium text-slate-500">
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#F5E7FF] px-1.5 py-0.5 text-[9px] font-semibold text-[#5B148F]">
                      <Layers className="h-3 w-3" />
                      {sims.length} simulation{sims.length === 1 ? '' : 's'}
                    </span>
                    {primarySim?.isLocked && (
                      <span
                        className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700"
                        title={`Used ${primarySim.executionCount ?? 0} time${(primarySim.executionCount ?? 0) === 1 ? '' : 's'}`}
                      >
                        <Lock className="h-3 w-3" /> Locked • Used {primarySim.executionCount ?? 0}
                      </span>
                    )}
                    {!primarySim?.isLocked && lockedCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                        <Lock className="h-3 w-3" /> {lockedCount} locked
                      </span>
                    )}
                  </div>
                </button>
              </article>
            )
          })}
        </div>
      )}

      {/* Version Picker Dialog */}
      <Dialog
        open={Boolean(pickerGroup)}
        onOpenChange={(open) => {
          if (!open) setPickerGroup(null)
        }}
      >
        <DialogContent className="p-6 sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Layers className="h-5 w-5 text-purple-600" /> Choose a simulation
          </DialogTitle>
          <DialogDescription>
            {pickerGroup?.groupSimulationName} has {pickerGroup?.simulations?.length ?? 0}{' '}
            simulations. Pick the one you want to open in the builder.
          </DialogDescription>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {(pickerGroup?.simulations ?? []).map((simulation) => (
              <button
                key={simulation.simulationId}
                type="button"
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                  simulation.simulationId === pickerBest?.simulationId
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => navigate(`/studio/${simulation.simulationId}`)}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  {simulation.simulationName}
                  {simulation.isLocked && (
                    <span
                      className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"
                      title={`Used ${simulation.executionCount ?? 0} times`}
                    >
                      <Lock className="h-3 w-3" /> Locked • {simulation.executionCount ?? 0}
                    </span>
                  )}
                </span>
                {simulation.simulationId === pickerBest?.simulationId && (
                  <span className="text-[10px] font-bold tracking-wider text-purple-600 uppercase">
                    Default
                  </span>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Group Dialog */}
      <Dialog
        open={Boolean(formGroup)}
        onOpenChange={(open) => {
          if (!open) setFormGroup(null)
        }}
      >
        <DialogContent className="p-6 sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <FolderKanban className="h-5 w-5 text-purple-600" />{' '}
            {editing ? 'Edit Simulation Group' : 'Create Simulation Group'}
          </DialogTitle>

          <form
            className="flex flex-col gap-4"
            key={editing?.groupSimulationId ?? 'new'}
            onSubmit={submit}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="simulation-name" className="text-slate-700">
                Group Simulation Name
              </Label>
              <Input
                id="simulation-name"
                name="name"
                required
                defaultValue={editing?.groupSimulationName ?? ''}
                placeholder="e.g. Customer Onboarding"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="simulation-desc" className="text-slate-700">
                Description
              </Label>
              <Textarea
                id="simulation-desc"
                rows={3}
                name="description"
                defaultValue={editing?.groupSimulationDesc ?? ''}
                placeholder="Describe the purpose of this simulation..."
              />
            </div>
            {!editing && (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="sim-name" className="text-slate-700">
                    Initial Simulation Name
                  </Label>
                  <Input
                    id="sim-name"
                    name="simulationName"
                    required
                    placeholder="e.g. Main Flow"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="channel-name" className="text-slate-700">
                    Channel
                  </Label>
                  <Input
                    id="channel-name"
                    name="channelName"
                    defaultValue="chat"
                    placeholder="chat"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="duration" className="text-slate-700">
                    Duration (minutes)
                  </Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    defaultValue="60"
                    placeholder="60"
                  />
                </div>
              </>
            )}

            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormGroup(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                <Save className="h-4 w-4" />{' '}
                {editing ? 'Save Changes' : create.isPending ? 'Creating…' : 'Create Simulation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="p-6 sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Trash2 className="h-5 w-5 text-red-600" /> Delete simulation group?
          </DialogTitle>
          <DialogDescription>
            This permanently deletes “{deleteTarget?.groupSimulationName}” and removes it from the
            studio. This cannot be undone.
          </DialogDescription>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleteTarget && remove.mutate(deleteTarget.groupSimulationId)}
              className="border-0 bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />{' '}
              {remove.isPending ? 'Deleting…' : 'Delete simulation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
