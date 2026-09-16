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
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { ApiError } from '../../../shared/api/client'
import {
  createMasterCall,
  deleteMasterCall,
  getMasterCalls,
  type MasterCall,
  updateMasterCall,
} from '../../../shared/api/master-data'
import { MasterPickerDialog } from '../pickers/master-picker-dialog'
import {
  callDialogInitialForm,
  emptyCallForm,
  validateCallForm,
  type CallFormValues,
} from './call-crud-logic'

const CALL_QUERY_KEY = ['master', 'calls']

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    try {
      const body = JSON.parse(error.message) as { info?: { message?: string } }
      return body.info?.message ?? error.message
    } catch {
      return error.message
    }
  }
  return error instanceof Error ? error.message : 'Unable to save call.'
}

export function CallCrudDialog({
  open,
  onOpenChange,
  nodeId,
  selectedCallId,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodeId: string
  selectedCallId?: string
  onSelect: (callId: string) => void
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<MasterCall | null>(null)
  const [form, setForm] = useState<CallFormValues>(emptyCallForm)
  const [actorPickerOpen, setActorPickerOpen] = useState(false)
  const callsQuery = useQuery({
    queryKey: CALL_QUERY_KEY,
    queryFn: getMasterCalls,
    enabled: open && Boolean(selectedCallId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const saveMutation = useMutation({
    mutationFn: (values: CallFormValues) =>
      editing
        ? updateMasterCall(editing.callId, values.actorId.trim(), values.content.trim())
        : createMasterCall(nodeId, values.actorId.trim(), values.content.trim()),
    onSuccess: (call) => {
      void queryClient.invalidateQueries({ queryKey: CALL_QUERY_KEY })
      onSelect(call.callId)
      onOpenChange(false)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteMasterCall,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CALL_QUERY_KEY })
      onSelect('')
      onOpenChange(false)
    },
  })
  const formError = validateCallForm(form)
  const isLoadingExisting = Boolean(selectedCallId) && callsQuery.isPending
  const resetSaveMutation = saveMutation.reset
  const resetDeleteMutation = deleteMutation.reset

  useEffect(() => {
    if (!open) return
    const records = callsQuery.data ?? []
    const selectedCall = selectedCallId
      ? (records.find((call) => call.callId === selectedCallId) ?? null)
      : null
    setEditing(selectedCall)
    setForm(callDialogInitialForm(selectedCallId, records))
    resetSaveMutation()
    resetDeleteMutation()
  }, [callsQuery.data, open, resetDeleteMutation, resetSaveMutation, selectedCallId])

  function submit() {
    if (formError || isLoadingExisting) return
    saveMutation.mutate(form)
  }

  function deleteCurrentCall() {
    if (!editing || deleteMutation.isPending) return
    if (window.confirm('Delete this call permanently?')) deleteMutation.mutate(editing.callId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(720px,calc(100vh-32px))] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle>{editing ? 'Edit call' : 'New call'}</DialogTitle>
          <DialogDescription>
            Update the actor and speech content for this node call.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 overflow-auto px-6 py-5">
          {isLoadingExisting && (
            <p className="text-muted-foreground text-xs">Loading this call...</p>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="master-call-actor">Actor</Label>
            <div className="flex gap-2">
              <Input
                id="master-call-actor"
                readOnly
                disabled={isLoadingExisting || saveMutation.isPending}
                value={form.actorId}
                placeholder="Select an actor"
                onClick={() => setActorPickerOpen(true)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isLoadingExisting || saveMutation.isPending}
                onClick={() => setActorPickerOpen(true)}
              >
                Pick actor
              </Button>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="master-call-content">Content</Label>
            <Textarea
              id="master-call-content"
              rows={7}
              disabled={isLoadingExisting || saveMutation.isPending}
              value={form.content}
              placeholder="Write the speech sent by this actor..."
              onChange={(event) =>
                setForm((current) => ({ ...current, content: event.target.value }))
              }
            />
          </div>
          {formError && <p className="text-destructive text-xs">{formError}</p>}
          {callsQuery.isError && (
            <p className="text-destructive text-xs">{errorMessage(callsQuery.error)}</p>
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
                onClick={deleteCurrentCall}
              >
                <Trash2 /> Delete call
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
              {saveMutation.isPending ? 'Saving...' : editing ? 'Save changes' : 'Create call'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
      <MasterPickerDialog
        open={actorPickerOpen}
        onOpenChange={setActorPickerOpen}
        title="Pick actor"
        resource="actors"
        endpoint="/admin/master-data/actors"
        displayFields={['actorId', 'actorName', 'actorEmail']}
        valueField="actorId"
        selected={form.actorId}
        onSelect={(record) =>
          setForm((current) => ({ ...current, actorId: String(record.actorId ?? '') }))
        }
      />
    </Dialog>
  )
}
