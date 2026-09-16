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
  createMasterEmail,
  deleteMasterEmail,
  getMasterDocumentContents,
  getStudioMasterEmail,
  type MasterEmail,
  updateMasterEmail,
} from '../../../shared/api/master-data'
import { MasterPickerDialog } from '../pickers/master-picker-dialog'
import {
  emailDialogInitialForm,
  emptyEmailForm,
  toggleEmailAttachment,
  validateEmailForm,
  type EmailFormValues,
} from './email-crud-logic'

const EMAIL_QUERY_KEY = ['master', 'emails']

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    try {
      const body = JSON.parse(error.message) as { info?: { message?: string } }
      return body.info?.message ?? error.message
    } catch {
      return error.message
    }
  }
  return error instanceof Error ? error.message : 'Unable to save email.'
}

export function EmailCrudDialog({
  open,
  onOpenChange,
  nodeId,
  simulationId,
  selectedEmailId,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodeId: string
  simulationId?: string | null
  selectedEmailId?: string
  onSelect: (emailId: string) => void
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<MasterEmail | null>(null)
  const [form, setForm] = useState<EmailFormValues>(emptyEmailForm)
  const [actorPicker, setActorPicker] = useState<'from' | 'to' | 'cc' | null>(null)
  const [parentPickerOpen, setParentPickerOpen] = useState(false)
  const [documentPickerOpen, setDocumentPickerOpen] = useState(false)
  const emailsQuery = useQuery({
    queryKey: ['master', 'email', selectedEmailId ?? 'new'],
    queryFn: () => getStudioMasterEmail(selectedEmailId!),
    enabled: open && Boolean(selectedEmailId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const documentsQuery = useQuery({
    queryKey: ['master', 'email-document-contents'],
    queryFn: getMasterDocumentContents,
    enabled: documentPickerOpen,
  })
  const saveMutation = useMutation({
    mutationFn: (values: EmailFormValues) => {
      const payload = {
        actorFrom: values.actorFrom.trim(),
        actorTo: values.actorTo.trim(),
        actorCc: values.actorCc.trim() || null,
        emailType: values.emailType,
        parentMasterEmailId: values.emailType === 'reply' ? values.parentMasterEmailId : null,
        subject: values.subject.trim(),
        content: values.content.trim(),
        docContentIds: values.docContentIds,
        prompt: values.prompt?.trim() ? values.prompt.trim() : null,
      }
      return editing
        ? updateMasterEmail(editing.emailId, payload)
        : createMasterEmail(nodeId, payload)
    },
    onSuccess: (email) => {
      void queryClient.invalidateQueries({ queryKey: EMAIL_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['master', 'email-originals', simulationId] })
      onSelect(email.emailId)
      onOpenChange(false)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteMasterEmail,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EMAIL_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['master', 'email-originals', simulationId] })
      onSelect('')
      onOpenChange(false)
    },
  })
  const formError = validateEmailForm(form)
  const isLoadingExisting = Boolean(selectedEmailId) && emailsQuery.isPending
  const disabled = isLoadingExisting || saveMutation.isPending || deleteMutation.isPending
  const resetSaveMutation = saveMutation.reset
  const resetDeleteMutation = deleteMutation.reset

  useEffect(() => {
    if (!open) return
    const records = emailsQuery.data ? [emailsQuery.data] : []
    const selected = selectedEmailId
      ? (records.find((email) => email.emailId === selectedEmailId) ?? null)
      : null
    setEditing(selected)
    setForm(emailDialogInitialForm(selectedEmailId, records))
    resetSaveMutation()
    resetDeleteMutation()
  }, [emailsQuery.data, open, resetDeleteMutation, resetSaveMutation, selectedEmailId])

  function setField<K extends keyof EmailFormValues>(field: K, value: EmailFormValues[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit() {
    if (!formError && !disabled) saveMutation.mutate(form)
  }

  function deleteCurrentEmail() {
    if (!editing || disabled) return
    if (window.confirm('Delete this email and its attachments permanently?')) {
      deleteMutation.mutate(editing.emailId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(760px,calc(100vh-32px))] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle>{editing ? 'Edit email' : 'New email'}</DialogTitle>
          <DialogDescription>
            Update the actors, content, and attachments for this node email.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 overflow-auto px-6 py-5">
          {isLoadingExisting && (
            <p className="text-muted-foreground text-xs">Loading this email...</p>
          )}
          <ActorField
            label="From actor"
            value={form.actorFrom}
            disabled={disabled}
            onPick={() => setActorPicker('from')}
          />
          <ActorField
            label="To actor"
            value={form.actorTo}
            disabled={disabled}
            onPick={() => setActorPicker('to')}
          />
          <ActorField
            label="CC actor (optional)"
            value={form.actorCc}
            disabled={disabled}
            onPick={() => setActorPicker('cc')}
          />
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Email type</legend>
            <div className="flex gap-4 text-sm">
              {(['original', 'reply'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 capitalize">
                  <input
                    type="radio"
                    name="master-email-type"
                    value={type}
                    checked={form.emailType === type}
                    disabled={disabled}
                    onChange={() =>
                      setForm((current) => ({
                        ...current,
                        emailType: type,
                        parentMasterEmailId: type === 'original' ? '' : current.parentMasterEmailId,
                      }))
                    }
                  />
                  {type}
                </label>
              ))}
            </div>
          </fieldset>
          {form.emailType === 'reply' && (
            <div className="grid gap-1.5">
              <Label htmlFor="master-email-parent">Original email</Label>
              <div className="flex gap-2">
                <Input
                  id="master-email-parent"
                  readOnly
                  value={form.parentMasterEmailId}
                  placeholder="Select original email"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled || !simulationId}
                  onClick={() => setParentPickerOpen(true)}
                >
                  Pick
                </Button>
              </div>
              {!simulationId && (
                <p className="text-destructive text-xs">
                  Simulation context is required for reply emails.
                </p>
              )}
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="master-email-subject">Subject</Label>
            <Input
              id="master-email-subject"
              disabled={disabled}
              value={form.subject}
              onChange={(event) => setField('subject', event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="master-email-content">Content</Label>
            <Textarea
              id="master-email-content"
              rows={8}
              disabled={disabled}
              value={form.content}
              onChange={(event) => setField('content', event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="master-email-prompt">Prompt (optional)</Label>
            <Textarea
              id="master-email-prompt"
              rows={4}
              disabled={disabled}
              value={form.prompt}
              placeholder="Optional prompt for AI generation..."
              onChange={(event) => setField('prompt', event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Attachment document content</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => setDocumentPickerOpen(true)}
              >
                Pick documents
              </Button>
            </div>
            {form.docContentIds.length > 0 ? (
              <div className="space-y-1 rounded-md border p-2 text-xs">
                {form.docContentIds.map((id) => (
                  <div key={id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {documentsQuery.data?.find((document) => document.docContentId === id)
                        ?.documentName ?? id}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled}
                      onClick={() =>
                        setField(
                          'docContentIds',
                          toggleEmailAttachment(form.docContentIds, id, false),
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">No document content attached.</p>
            )}
          </div>
          {formError && <p className="text-destructive text-xs">{formError}</p>}
          {emailsQuery.isError && (
            <p className="text-destructive text-xs">{errorMessage(emailsQuery.error)}</p>
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
                disabled={disabled}
                onClick={deleteCurrentEmail}
              >
                <Trash2 /> Delete email
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={disabled}
            >
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={Boolean(formError) || disabled}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Save changes' : 'Create email'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
      <MasterPickerDialog
        open={actorPicker !== null}
        onOpenChange={(next) => !next && setActorPicker(null)}
        title="Pick actor"
        resource="actors"
        endpoint="/admin/master-data/actors"
        displayFields={['actorId', 'actorName', 'actorEmail']}
        valueField="actorId"
        selected={
          actorPicker === 'from'
            ? form.actorFrom
            : actorPicker === 'to'
              ? form.actorTo
              : form.actorCc
        }
        onSelect={(record) => {
          if (actorPicker)
            setField(
              actorPicker === 'from' ? 'actorFrom' : actorPicker === 'to' ? 'actorTo' : 'actorCc',
              String(record.actorId ?? ''),
            )
          setActorPicker(null)
        }}
      />
      <MasterPickerDialog
        open={parentPickerOpen}
        onOpenChange={setParentPickerOpen}
        title="Pick original email"
        description="Only original emails from the current simulation are shown."
        resource="email-originals"
        endpoint={
          simulationId
            ? (() => {
                const params = new URLSearchParams({ simulationId })
                if (editing?.emailId) params.set('excludeEmailId', editing.emailId)
                return `/admin/master-data/emails/originals?${params.toString()}`
              })()
            : undefined
        }
        displayFields={['emailId', 'subject']}
        valueField="emailId"
        selected={form.parentMasterEmailId}
        onSelect={(record) => setField('parentMasterEmailId', String(record.emailId ?? ''))}
      />
      <MasterPickerDialog
        open={documentPickerOpen}
        onOpenChange={setDocumentPickerOpen}
        title="Pick document content"
        description="Select one document content at a time; repeat to add multiple attachments."
        resource="email-document-contents"
        endpoint="/admin/master-data/emails/document-contents"
        displayFields={['docContentId', 'documentName', 'page', 'content']}
        valueField="docContentId"
        selected={form.docContentIds}
        onSelect={(record) =>
          setField(
            'docContentIds',
            toggleEmailAttachment(form.docContentIds, String(record.docContentId ?? ''), true),
          )
        }
      />
    </Dialog>
  )
}

function ActorField({
  label,
  value,
  disabled,
  onPick,
}: {
  label: string
  value: string
  disabled: boolean
  onPick: () => void
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input readOnly disabled={disabled} value={value} placeholder="Select an actor" />
        <Button type="button" variant="outline" disabled={disabled} onClick={onPick}>
          Pick
        </Button>
      </div>
    </div>
  )
}
