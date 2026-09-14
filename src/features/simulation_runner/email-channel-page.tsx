import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import {
  getEmailInbox,
  getEmailThreadMessages,
  markEmailAttachmentOpened,
  type EmailInboxThreadItem,
  type EmailMessage as ApiEmailMessage,
  type ParticipantEmailAttachmentInput,
  type RuntimeEmailAttachment,
} from '../../shared/api/email'
import { getDocuments } from '../../shared/api/documents'
import { AttachmentPreviewDialog } from './email/attachment-preview-dialog'
import { AttachmentPickerDialog, type AttachmentSelection } from './email/attachment-picker-dialog'
import { EmailWorkspace } from './email/email-workspace'
import type { EmailAttachment, EmailInboxThread, EmailMessage } from './email/types'
import { useSimulationRun } from './simulation-run-context'

export function EmailChannelPage() {
  const queryClient = useQueryClient()
  const { participantId, runnerParticipantId, isEmailPending, sendEmail, markEmailThreadRead } =
    useSimulationRun()

  const toEmailMessage = (message: ApiEmailMessage): EmailMessage => ({
    messageId: message.participantEmailId,
    from: message.senderId,
    to: message.to,
    cc: message.cc,
    actor: message.senderId,
    channel: 'email' as const,
    emailId: null,
    actionType: 'message',
    subject: message.subject,
    content: message.content,
    timestamp: message.createdDate,
    sessionId: message.sessionId,
    simulationId: message.simulationId ?? undefined,
    isUnread: message.isRead === false,
    attachments: message.attachments ?? [],
  })

  const toEmailThread = (item: EmailInboxThreadItem): EmailInboxThread => ({
    rootId: item.rootId,
    latestSenderId: item.latestSenderId,
    latestSenderType: item.latestSenderType,
    latestSubject: item.latestSubject,
    latestContent: item.latestContent,
    latestIsRead: item.latestIsRead,
    latestCreatedDate: item.latestCreatedDate,
    unreadCount: item.unreadCount,
    messageCount: item.messageCount,
    simulationId: item.simulationId,
  })

  // Fetch all threads across all simulations (no simulationId filter).
  const inboxQuery = useQuery({
    queryKey: ['email-inbox', participantId],
    queryFn: () => getEmailInbox(participantId),
    enabled: Boolean(participantId.trim()),
  })
  const threads = (inboxQuery.data ?? []).map(toEmailThread)

  const [selectedRootId, setSelectedRootId] = useState<string | null>(null)
  const [readPendingThreads, setReadPendingThreads] = useState<ReadonlySet<string>>(new Set())
  const [openingAttachmentIds, setOpeningAttachmentIds] = useState<ReadonlySet<string>>(new Set())
  const [previewAttachment, setPreviewAttachment] = useState<EmailAttachment | null>(null)
  const [selectedAttachments, setSelectedAttachments] = useState<AttachmentSelection[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const documentsQuery = useQuery({
    queryKey: ['runner-documents', participantId],
    queryFn: () => getDocuments(participantId),
    enabled: Boolean(participantId.trim()),
  })

  const handleOpenPicker = () => {
    void queryClient.invalidateQueries({ queryKey: ['runner-documents', participantId] })
    void queryClient.invalidateQueries({ queryKey: ['documents', participantId] })
    setIsPickerOpen(true)
  }

  const selectedThread = threads.find((t) => t.rootId === selectedRootId) ?? null

  // Fetch messages for the selected thread using its simulationId.
  const threadVersionId = selectedThread?.simulationId ?? null
  const threadMessagesQuery = useQuery({
    queryKey: ['email-thread-messages', participantId, threadVersionId, selectedRootId],
    queryFn: () => getEmailThreadMessages(participantId, threadVersionId!, selectedRootId!),
    enabled: Boolean(
      participantId.trim() &&
      threadVersionId &&
      selectedRootId &&
      !readPendingThreads.has(selectedRootId),
    ),
  })

  const visibleMessages: EmailMessage[] = (threadMessagesQuery.data ?? []).map(toEmailMessage)

  const attachmentOpenMutation = useMutation({
    mutationFn: ({
      attachmentId,
      participantEmailId,
    }: {
      attachmentId: string
      participantEmailId: string
    }) =>
      markEmailAttachmentOpened(attachmentId, participantId, threadVersionId!, participantEmailId),
    onSuccess: (
      openedAttachment: RuntimeEmailAttachment,
      { participantEmailId }: { attachmentId: string; participantEmailId: string },
    ) => {
      queryClient.setQueryData<ApiEmailMessage[]>(
        ['email-thread-messages', participantId, threadVersionId, selectedRootId],
        (messages) =>
          messages?.map((message) =>
            message.participantEmailId === participantEmailId
              ? {
                  ...message,
                  attachments: message.attachments.map((attachment) =>
                    attachment.emailAttachmentId === openedAttachment.emailAttachmentId
                      ? openedAttachment
                      : attachment,
                  ),
                }
              : message,
          ),
      )
      setPreviewAttachment(openedAttachment)
    },
    onMutate: ({ attachmentId }) => {
      setOpeningAttachmentIds((current) => new Set(current).add(attachmentId))
    },
    onSettled: (_data, _error, { attachmentId }) => {
      setOpeningAttachmentIds((current) => {
        const next = new Set(current)
        next.delete(attachmentId)
        return next
      })
    },
  })

  const disabled = isEmailPending

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const target = String(data.get('target') ?? '').trim()
    if (!threadVersionId || !target) return
    const attachments: ParticipantEmailAttachmentInput[] = selectedAttachments.map((selection) => ({
      participantDocId: selection.participantDocId,
      contents: selection.contents.map((page) => ({
        participantDocContentId: page.participantDocContentId,
      })),
    }))
    sendEmail({
      simulationId: threadVersionId,
      target,
      subject: String(data.get('subject') ?? ''),
      content: String(data.get('content') ?? ''),
      parentEmailId: selectedRootId ?? undefined,
      replyToEmailId: visibleMessages.at(-1)?.messageId,
      attachments,
    })
    setSelectedAttachments([])
    event.currentTarget.reset()
  }

  function openAttachment(message: EmailMessage, attachment: EmailAttachment) {
    if (
      !threadVersionId ||
      !message.messageId ||
      openingAttachmentIds.has(attachment.emailAttachmentId)
    )
      return
    if (attachment.openedAt) {
      setPreviewAttachment(attachment)
      return
    }
    attachmentOpenMutation.mutate({
      attachmentId: attachment.emailAttachmentId,
      participantEmailId: message.messageId,
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <EmailWorkspace
        participantId={runnerParticipantId}
        messages={visibleMessages}
        threads={threads}
        selectedRootId={selectedRootId}
        onSelectThread={setSelectedRootId}
        selectedThread={selectedThread}
        disabled={disabled}
        attachments={selectedAttachments}
        onOpenAttachmentPicker={handleOpenPicker}
        onRemoveAttachment={(participantDocId) =>
          setSelectedAttachments((current) =>
            current.filter((selection) => selection.participantDocId !== participantDocId),
          )
        }
        onSubmit={submit}
        openingAttachmentIds={openingAttachmentIds}
        onOpenAttachment={openAttachment}
        onConversationOpen={(rootId) => {
          const thread = threads.find((t) => t.rootId === rootId)
          if (thread && thread.unreadCount > 0 && thread.simulationId) {
            setReadPendingThreads((prev) => new Set(prev).add(rootId))
            void markEmailThreadRead(thread.simulationId, rootId).finally(() =>
              setReadPendingThreads((prev) => {
                const next = new Set(prev)
                next.delete(rootId)
                return next
              }),
            )
          }
        }}
      />
      {previewAttachment ? (
        <AttachmentPreviewDialog
          attachment={previewAttachment}
          open
          onOpenChange={(open) => {
            if (!open) setPreviewAttachment(null)
          }}
        />
      ) : null}
      <AttachmentPickerDialog
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        documents={documentsQuery.data ?? []}
        isLoading={documentsQuery.isLoading}
        initialSelection={selectedAttachments}
        onConfirm={setSelectedAttachments}
      />
      {attachmentOpenMutation.isError ? (
        <p className="text-xs text-red-600" role="alert">
          Unable to record the attachment opening. Please try again.
        </p>
      ) : null}
    </div>
  )
}
