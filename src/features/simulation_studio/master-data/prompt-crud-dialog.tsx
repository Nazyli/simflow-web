import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Label } from '../../../components/ui/label'
import { ApiError } from '../../../shared/api/client'
import {
  createMasterPrompt,
  deleteMasterPrompt,
  getMasterPrompts,
  type MasterPrompt,
  updateMasterPrompt,
} from '../../../shared/api/master-data'
import {
  emptyPromptForm,
  promptDialogInitialForm,
  validatePromptForm,
  type PromptFormValues,
} from './prompt-crud-logic'
import { useTemplateContract } from './template-contract-logic'
import { TemplateTextarea } from './template-placeholder-picker'

const PROMPT_QUERY_KEY = ['master', 'prompts']

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    try {
      const body = JSON.parse(error.message) as { info?: { message?: string } }
      return body.info?.message ?? error.message
    } catch {
      return error.message
    }
  }
  return error instanceof Error ? error.message : 'Unable to save prompt.'
}

export function PromptCrudDialog({
  open,
  onOpenChange,
  nodeId,
  nodeType = 'ai_classification',
  selectedPromptId,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodeId: string
  nodeType?: string
  selectedPromptId?: string
  onSelect: (promptId: string) => void
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<MasterPrompt | null>(null)
  const [form, setForm] = useState<PromptFormValues>(emptyPromptForm)
  const contentContract = useTemplateContract(nodeType, 'prompt')
  const promptsQuery = useQuery({
    queryKey: PROMPT_QUERY_KEY,
    queryFn: getMasterPrompts,
    enabled: open && Boolean(selectedPromptId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const saveMutation = useMutation({
    mutationFn: (values: PromptFormValues) =>
      editing
        ? updateMasterPrompt(editing.promptId, values.content.trim())
        : createMasterPrompt(nodeId, values.content.trim()),
    onSuccess: (prompt) => {
      void queryClient.invalidateQueries({ queryKey: PROMPT_QUERY_KEY })
      onSelect(prompt.promptId)
      onOpenChange(false)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteMasterPrompt,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROMPT_QUERY_KEY })
      onSelect('')
      onOpenChange(false)
    },
  })
  const formError = validatePromptForm(form)
  const isLoadingExisting = Boolean(selectedPromptId) && promptsQuery.isPending
  const resetSaveMutation = saveMutation.reset
  const resetDeleteMutation = deleteMutation.reset

  useEffect(() => {
    if (!open) return
    const records = promptsQuery.data ?? []
    const selectedPrompt = selectedPromptId
      ? (records.find((prompt) => prompt.promptId === selectedPromptId) ?? null)
      : null
    setEditing(selectedPrompt)
    setForm(promptDialogInitialForm(selectedPromptId, records))
    resetSaveMutation()
    resetDeleteMutation()
  }, [open, promptsQuery.data, resetDeleteMutation, resetSaveMutation, selectedPromptId])

  function submit() {
    if (formError || isLoadingExisting) return
    saveMutation.mutate(form)
  }

  function deleteCurrentPrompt() {
    if (!editing || deleteMutation.isPending) return
    if (window.confirm('Delete this prompt permanently?')) deleteMutation.mutate(editing.promptId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(720px,calc(100vh-32px))] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle>{editing ? 'Edit prompt' : 'New prompt'}</DialogTitle>
          <DialogDescription>Update the prompt content for this node.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 overflow-auto px-6 py-5">
          {isLoadingExisting && (
            <p className="text-muted-foreground text-xs">Loading this prompt...</p>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="master-prompt-content">Content</Label>
            <TemplateTextarea
              id="master-prompt-content"
              rows={9}
              disabled={isLoadingExisting || saveMutation.isPending}
              value={form.content}
              placeholders={contentContract.contract?.allowedPlaceholders}
              placeholder="Write the classification prompt..."
              onValueChange={(value) => setForm((current) => ({ ...current, content: value }))}
            />
          </div>
          {formError && <p className="text-destructive text-xs">{formError}</p>}
          {promptsQuery.isError && (
            <p className="text-destructive text-xs">{errorMessage(promptsQuery.error)}</p>
          )}
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
                disabled={saveMutation.isPending || deleteMutation.isPending}
                onClick={deleteCurrentPrompt}
              >
                <Trash2 /> Delete prompt
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saveMutation.isPending || deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={Boolean(formError) || isLoadingExisting || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : editing ? 'Save changes' : 'Create prompt'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
