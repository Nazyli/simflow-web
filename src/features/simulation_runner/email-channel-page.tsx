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
    message_id: message.participant_email_id,
    from: message.sender_id,
    to: message.to,
    cc: message.cc,
    actor: message.sender_id,
    channel: 'email' as const,
    email_id: null,
    action_type: 'message',
    subject: message.subject,
    content: message.content,
    timestamp: message.created_date,
    session_id: message.session_id,
    simulation_id: message.simulation_id ?? undefined,
    is_unread: message.is_read === false,
    attachments: message.attachments ?? [],
  })

  const toEmailThread = (item: EmailInboxThreadItem): EmailInboxThread => ({
    rootId: item.root_id,
    latestSenderId: item.latest_sender_id,
    latestSenderType: item.latest_sender_type,
    latestSubject: item.latest_subject,
    latestContent: item.latest_content,
    latestIsRead: item.latest_is_read,
    latestCreatedDate: item.latest_created_date,
    unreadCount: item.unread_count,
    messageCount: item.message_count,
    simulationId: item.simulation_id,
  })

  // Fetch all threads across all simulations (no simulation_id filter).
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

  const selectedThread = threads.find((t) => t.rootId === selectedRootId) ?? null

  // Fetch messages for the selected thread using its simulation_id.
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
            message.participant_email_id === participantEmailId
              ? {
                  ...message,
                  attachments: message.attachments.map((attachment) =>
                    attachment.email_attachment_id === openedAttachment.email_attachment_id
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
      participant_doc_id: selection.participant_doc_id,
      contents: selection.contents.map((page) => ({
        participant_doc_content_id: page.participant_doc_content_id,
      })),
    }))
    sendEmail({
      simulationId: threadVersionId,
      target,
      subject: String(data.get('subject') ?? ''),
      content: String(data.get('content') ?? ''),
      parentEmailId: selectedRootId ?? undefined,
      replyToEmailId: visibleMessages.at(-1)?.message_id,
      attachments,
    })
    setSelectedAttachments([])
    event.currentTarget.reset()
  }

  function openAttachment(message: EmailMessage, attachment: EmailAttachment) {
    if (
      !threadVersionId ||
      !message.message_id ||
      openingAttachmentIds.has(attachment.email_attachment_id)
    )
      return
    if (attachment.opened_at) {
      setPreviewAttachment(attachment)
      return
    }
    attachmentOpenMutation.mutate({
      attachmentId: attachment.email_attachment_id,
      participantEmailId: message.message_id,
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
        onOpenAttachmentPicker={() => setIsPickerOpen(true)}
        onRemoveAttachment={(participantDocId) =>
          setSelectedAttachments((current) =>
            current.filter((selection) => selection.participant_doc_id !== participantDocId),
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
