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
import { ApiError } from '../../../shared/api/client'
import {
  createMasterChat,
  deleteMasterChat,
  getMasterChats,
  type MasterChat,
  updateMasterChat,
} from '../../../shared/api/master-data'
import { MasterPickerDialog } from '../pickers/master-picker-dialog'
import {
  chatDialogInitialForm,
  emptyChatForm,
  validateChatForm,
  type ChatFormValues,
} from './chat-crud-logic'
import { PromptContentEditor } from './prompt-content-editor'
import { useTemplateContract } from './template-contract-logic'
import { TemplateTextarea } from './template-placeholder-picker'

const CHAT_QUERY_KEY = ['master', 'chats']

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    try {
      const body = JSON.parse(error.message) as { info?: { message?: string } }
      return body.info?.message ?? error.message
    } catch {
      return error.message
    }
  }
  return error instanceof Error ? error.message : 'Unable to save chat.'
}

export function ChatCrudDialog({
  open,
  onOpenChange,
  nodeId,
  nodeType = 'send_chat',
  selectedChatId,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodeId: string
  nodeType?: string
  selectedChatId?: string
  onSelect: (chatId: string) => void
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<MasterChat | null>(null)
  const [form, setForm] = useState<ChatFormValues>(emptyChatForm)
  const [actorPickerOpen, setActorPickerOpen] = useState(false)
  const contentContract = useTemplateContract(nodeType, 'content')
  const promptContract = useTemplateContract(nodeType, 'prompt')
  const chatsQuery = useQuery({
    queryKey: CHAT_QUERY_KEY,
    queryFn: getMasterChats,
    enabled: open && Boolean(selectedChatId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const saveMutation = useMutation({
    mutationFn: (values: ChatFormValues) =>
      editing
        ? updateMasterChat(
            editing.chatId,
            values.actorId.trim(),
            values.content.trim(),
            values.prompt?.trim() ? values.prompt.trim() : null,
          )
        : createMasterChat(
            nodeId,
            values.actorId.trim(),
            values.content.trim(),
            values.prompt?.trim() ? values.prompt.trim() : null,
          ),
    onSuccess: (chat) => {
      void queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEY })
      onSelect(chat.chatId)
      onOpenChange(false)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteMasterChat,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEY })
      onSelect('')
      onOpenChange(false)
    },
  })
  const resetSaveMutation = saveMutation.reset
  const resetDeleteMutation = deleteMutation.reset
  const formError = validateChatForm(form)
  const isLoadingExisting = Boolean(selectedChatId) && chatsQuery.isPending

  useEffect(() => {
    if (!open) return
    const records = chatsQuery.data ?? []
    const selectedChat = selectedChatId
      ? (records.find((chat) => chat.chatId === selectedChatId) ?? null)
      : null
    setEditing(selectedChat)
    setForm(chatDialogInitialForm(selectedChatId, records))
    resetSaveMutation()
    resetDeleteMutation()
  }, [chatsQuery.data, open, resetDeleteMutation, resetSaveMutation, selectedChatId])

  function submit() {
    if (formError || isLoadingExisting) return
    saveMutation.mutate(form)
  }

  function deleteCurrentChat() {
    if (!editing || deleteMutation.isPending) return
    if (window.confirm('Delete this chat permanently?')) deleteMutation.mutate(editing.chatId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(720px,calc(100vh-32px))] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle>{editing ? 'Edit chat' : 'New chat'}</DialogTitle>
          <DialogDescription>
            Update the actor and message content for this node chat.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 overflow-auto px-6 py-5">
          {isLoadingExisting && (
            <p className="text-muted-foreground text-xs">Loading this chat...</p>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="master-chat-actor">Actor</Label>
            <div className="flex gap-2">
              <Input
                id="master-chat-actor"
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
            <Label htmlFor="master-chat-content">Content</Label>
            <TemplateTextarea
              id="master-chat-content"
              rows={7}
              disabled={isLoadingExisting || saveMutation.isPending}
              value={form.content}
              placeholders={contentContract.contract?.allowedPlaceholders}
              placeholder="Write the message sent by this actor..."
              onValueChange={(value) => setForm((current) => ({ ...current, content: value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="master-chat-prompt">Prompt (optional)</Label>
            <PromptContentEditor
              id="master-chat-prompt"
              disabled={isLoadingExisting || saveMutation.isPending}
              value={form.prompt}
              placeholders={promptContract.contract?.allowedPlaceholders}
              onValueChange={(value) => setForm((current) => ({ ...current, prompt: value }))}
            />
          </div>
          {formError && <p className="text-destructive text-xs">{formError}</p>}
          {chatsQuery.isError && (
            <p className="text-destructive text-xs">{errorMessage(chatsQuery.error)}</p>
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
                onClick={deleteCurrentChat}
              >
                <Trash2 /> Delete chat
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
              {saveMutation.isPending ? 'Saving...' : editing ? 'Save changes' : 'Create chat'}
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
        onSelect={(record) => {
          const actorId = record.actorId
          setForm((current) => ({
            ...current,
            actorId: actorId === null || actorId === undefined ? '' : String(actorId),
          }))
        }}
      />
    </Dialog>
  )
}
