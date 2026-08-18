import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import {
  getEmailInbox,
  getEmailThreadMessages,
  type EmailInboxThreadItem,
  type EmailMessage as ApiEmailMessage,
} from '../../shared/api/email'
import { EmailWorkspace } from './email/email-workspace'
import type { EmailInboxThread, EmailMessage } from './email/types'
import { useSimulationRun } from './simulation-run-context'

export function EmailChannelPage() {
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

  const selectedThread = threads.find((t) => t.rootId === selectedRootId) ?? null

  // Fetch messages for the selected thread using its workflow_version_id.
  const threadVersionId = selectedThread?.workflowVersionId ?? null
  const threadMessagesQuery = useQuery({
    queryKey: ['email-thread-messages', participantId, threadVersionId, selectedRootId],
    queryFn: () =>
      getEmailThreadMessages(participantId, threadVersionId!, selectedRootId!),
    enabled: Boolean(
      participantId.trim() &&
        threadVersionId &&
        selectedRootId &&
        !readPendingThreads.has(selectedRootId),
    ),
  })

  const visibleMessages: EmailMessage[] = (threadMessagesQuery.data ?? []).map(toEmailMessage)

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
    })
    event.currentTarget.reset()
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
    </div>
  )
}
