import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import {
  getEmailInbox,
  getEmailThreadMessages,
  markEmailAttachmentOpened,
  type EmailInboxThreadItem,
  type EmailMessage as ApiEmailMessage,
  type RuntimeEmailAttachment,
} from '../../shared/api/email'
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
    workflow_version_id: message.workflow_version_id ?? undefined,
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
    workflowVersionId: item.workflow_version_id,
  })

  // Fetch all threads across all workflows (no workflow_version_id filter).
  const inboxQuery = useQuery({
    queryKey: ['email-inbox', participantId],
    queryFn: () => getEmailInbox(participantId),
    enabled: Boolean(participantId.trim()),
  })
  const threads = (inboxQuery.data ?? []).map(toEmailThread)

  const [selectedRootId, setSelectedRootId] = useState<string | null>(null)
  const [readPendingThreads, setReadPendingThreads] = useState<ReadonlySet<string>>(new Set())
  const [openingAttachmentIds, setOpeningAttachmentIds] = useState<ReadonlySet<string>>(new Set())

  const selectedThread = threads.find((t) => t.rootId === selectedRootId) ?? null

  // Fetch messages for the selected thread using its workflow_version_id.
  const threadVersionId = selectedThread?.workflowVersionId ?? null
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
                    attachment.attachment_id === openedAttachment.attachment_id
                      ? openedAttachment
                      : attachment,
                  ),
                }
              : message,
          ),
      )
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
    sendEmail({
      workflowVersionId: threadVersionId,
      target,
      subject: String(data.get('subject') ?? ''),
      content: String(data.get('content') ?? ''),
      parentEmailId: selectedRootId ?? undefined,
      replyToEmailId: visibleMessages.at(-1)?.message_id,
    })
    event.currentTarget.reset()
  }

  function openAttachment(message: EmailMessage, attachment: EmailAttachment) {
    if (
      !threadVersionId ||
      !message.message_id ||
      attachment.opened_at ||
      openingAttachmentIds.has(attachment.attachment_id)
    )
      return
    attachmentOpenMutation.mutate({
      attachmentId: attachment.attachment_id,
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
        onSubmit={submit}
        openingAttachmentIds={openingAttachmentIds}
        onOpenAttachment={openAttachment}
        onConversationOpen={(rootId) => {
          const thread = threads.find((t) => t.rootId === rootId)
          if (thread && thread.unreadCount > 0 && thread.workflowVersionId) {
            setReadPendingThreads((prev) => new Set(prev).add(rootId))
            void markEmailThreadRead(thread.workflowVersionId, rootId).finally(() =>
              setReadPendingThreads((prev) => {
                const next = new Set(prev)
                next.delete(rootId)
                return next
              }),
            )
          }
        }}
      />
      {attachmentOpenMutation.isError ? (
        <p className="text-xs text-red-600" role="alert">
          Unable to record the attachment opening. Please try again.
        </p>
      ) : null}
    </div>
  )
}
