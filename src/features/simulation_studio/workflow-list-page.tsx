import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderKanban, Layers, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { ApiError } from '../../shared/api/client'
import {
  createVersion,
  createWorkflow,
  deleteWorkflow,
  getWorkflows,
  updateWorkflow,
} from '../../shared/api/workflows'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/async-state'
import { StatusBadge } from '../../shared/components/status-badge'
import type { Workflow, WorkflowVersion } from '../../shared/types/workflow'

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

function bestVersion(workflow: Workflow): WorkflowVersion | undefined {
  const versions = workflow.versions ?? []
  return (
    versions.find((version) => version.status === 'draft') ??
    versions.find((version) => version.workflow_version_id === workflow.active_version_id) ??
    versions[0]
  )
}

export function WorkflowListPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [pickerWorkflow, setPickerWorkflow] = useState<Workflow | null>(null)
  const [formWorkflow, setFormWorkflow] = useState<Workflow | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null)

  const workflows = useQuery({ queryKey: ['workflows'], queryFn: getWorkflows })

  const create = useMutation({
    mutationFn: async (
      payload: Pick<Workflow, 'workflow_name' | 'workflow_desc' | 'workspace_id'>,
    ) => {
      const workflow = await createWorkflow(payload)
      const version = await createVersion(workflow.workflow_id)
      return { workflow, version }
    },
    onSuccess: ({ version }) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      setFormWorkflow(null)
      navigate(`/studio/${version.workflow_version_id}`)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Pick<Workflow, 'workflow_name' | 'workflow_desc' | 'workspace_id'>
    }) => updateWorkflow(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      setFormWorkflow(null)
      toast.success('Workflow updated.')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const remove = useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      setDeleteTarget(null)
      toast.success('Workflow deleted.')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const bootstrapVersion = useMutation({
    mutationFn: createVersion,
    onSuccess: (version) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      navigate(`/studio/${version.workflow_version_id}`)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  function openWorkflow(workflow: Workflow) {
    const versions = workflow.versions ?? []
    if (versions.length === 0) {
      bootstrapVersion.mutate(workflow.workflow_id)
      return
    }
    if (versions.length === 1) {
      navigate(`/studio/${versions[0].workflow_version_id}`)
      return
    }
    setPickerWorkflow(workflow)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      workflow_name: String(form.get('name')),
      workflow_desc: String(form.get('description')) || null,
      workspace_id: null,
    }
    if (formWorkflow && formWorkflow !== 'new') {
      update.mutate({ id: formWorkflow.workflow_id, payload })
    } else {
      create.mutate(payload)
    }
  }

  const editing = formWorkflow && formWorkflow !== 'new' ? formWorkflow : null
  const pickerBest = pickerWorkflow ? bestVersion(pickerWorkflow) : undefined

  return (
    <main className="min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-sm">
            <FolderKanban size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-purple-700 uppercase">
              Simulation Builder
            </p>
            <h1 className="truncate text-lg font-bold text-slate-900">Workflows</h1>
            <p className="truncate text-xs text-slate-500">
              Open a workflow in the builder, or create a new simulation workflow.
            </p>
          </div>
        </div>
        <Button type="button" onClick={() => setFormWorkflow('new')}>
          <Plus className="h-4 w-4" /> New Workflow
        </Button>
      </header>

      {workflows.isPending && <LoadingState variant="runner" />}
      {workflows.isError && <ErrorState message="Unable to load workflows." />}

      {workflows.data && workflows.data.length === 0 && (
        <EmptyState
          title="No workflows yet"
          description="Create your first simulation workflow to start building scenarios with nodes, ports, and edges."
          action={
            <Button type="button" onClick={() => setFormWorkflow('new')}>
              <Plus className="h-4 w-4" /> Create your first workflow
            </Button>
          }
        />
      )}

      {workflows.data && workflows.data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workflows.data.map((workflow) => {
            const versions = workflow.versions ?? []
            const activeVersion = versions.find(
              (version) => version.workflow_version_id === workflow.active_version_id,
            )
            const draftVersion = versions.find((version) => version.status === 'draft')
            return (
              <article
                key={workflow.workflow_id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 hover:shadow-md"
              >
                <button
                  type="button"
                  className="flex flex-1 flex-col gap-2 p-4 text-left"
                  onClick={() => openWorkflow(workflow)}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <h2 className="truncate text-sm font-bold text-slate-900">
                      {workflow.workflow_name}
                    </h2>
                    <StatusBadge status={workflow.status} />
                  </div>
                  <p className="line-clamp-2 min-h-8 text-xs leading-normal text-slate-500">
                    {workflow.workflow_desc || 'No description provided.'}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-[11px] font-medium text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5">
                      <Layers className="h-3 w-3" />
                      {versions.length} version{versions.length === 1 ? '' : 's'}
                    </span>
                    {activeVersion && <span>v{activeVersion.version_number} active</span>}
                    {draftVersion &&
                      draftVersion.workflow_version_id !== activeVersion?.workflow_version_id && (
                        <span>v{draftVersion.version_number} draft</span>
                      )}
                  </div>
                </button>
                <footer className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
                  <span className="text-[11px] text-slate-400">Click to open in builder</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${workflow.workflow_name}`}
                      title="Edit workflow details"
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => setFormWorkflow(workflow)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${workflow.workflow_name}`}
                      title="Delete workflow"
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      onClick={() => setDeleteTarget(workflow)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </footer>
              </article>
            )
          })}
        </div>
      )}

      {/* Version Picker Dialog */}
      <Dialog
        open={Boolean(pickerWorkflow)}
        onOpenChange={(open) => {
          if (!open) setPickerWorkflow(null)
        }}
      >
        <DialogContent className="p-6 sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Layers className="h-5 w-5 text-purple-600" /> Choose a version
          </DialogTitle>
          <DialogDescription>
            {pickerWorkflow?.workflow_name} has {pickerWorkflow?.versions?.length ?? 0} versions.
            Pick the one you want to open in the builder.
          </DialogDescription>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {(pickerWorkflow?.versions ?? []).map((version) => (
              <button
                key={version.workflow_version_id}
                type="button"
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                  version.workflow_version_id === pickerBest?.workflow_version_id
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => navigate(`/studio/${version.workflow_version_id}`)}
              >
                <span className="text-sm font-semibold text-slate-800">
                  Version {version.version_number}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {version.workflow_version_id === pickerBest?.workflow_version_id && (
                    <span className="text-[10px] font-bold tracking-wider text-purple-600 uppercase">
                      Default
                    </span>
                  )}
                  <StatusBadge status={version.status} />
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Workflow Dialog */}
      <Dialog
        open={Boolean(formWorkflow)}
        onOpenChange={(open) => {
          if (!open) setFormWorkflow(null)
        }}
      >
        <DialogContent className="p-6 sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <FolderKanban className="h-5 w-5 text-purple-600" />{' '}
            {editing ? 'Edit Workflow' : 'Create Workflow'}
          </DialogTitle>

          <form
            className="flex flex-col gap-4"
            key={editing?.workflow_id ?? 'new'}
            onSubmit={submit}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="workflow-name" className="text-slate-700">
                Workflow Name
              </Label>
              <Input
                id="workflow-name"
                name="name"
                required
                defaultValue={editing?.workflow_name ?? ''}
                placeholder="e.g. Customer Onboarding Engine"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="workflow-desc" className="text-slate-700">
                Description
              </Label>
              <Textarea
                id="workflow-desc"
                rows={3}
                name="description"
                defaultValue={editing?.workflow_desc ?? ''}
                placeholder="Describe the purpose of this simulation..."
              />
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormWorkflow(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                <Save className="h-4 w-4" />{' '}
                {editing ? 'Save Changes' : create.isPending ? 'Creating…' : 'Create Workflow'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Workflow Confirmation */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="p-6 sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Trash2 className="h-5 w-5 text-red-600" /> Delete workflow?
          </DialogTitle>
          <DialogDescription>
            This permanently deletes “{deleteTarget?.workflow_name}” and removes it from the
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
              onClick={() => deleteTarget && remove.mutate(deleteTarget.workflow_id)}
              className="border-0 bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />{' '}
              {remove.isPending ? 'Deleting…' : 'Delete workflow'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
