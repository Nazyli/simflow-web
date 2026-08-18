import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import {
  getEmailInbox,
  getEmailThreadMessages,
  getEmailWorkflows,
  type EmailInboxThreadItem,
  type EmailMessage as ApiEmailMessage,
  type EmailWorkflowItem,
} from '../../shared/api/email'
import { EmailWorkspace } from './email/email-workspace'
import type { EmailInboxThread, EmailMessage, EmailWorkflow } from './email/types'
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

  const toEmailWorkflow = (item: EmailWorkflowItem): EmailWorkflow => ({
    workflowVersionId: item.workflow_version_id,
    workflowName: item.workflow_name,
    versionNumber: item.version_number,
    status: item.status,
    unreadCount: item.unread_count,
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
  })

  const workflowsQuery = useQuery({
    queryKey: ['email-workflows', participantId],
    queryFn: () => getEmailWorkflows(participantId),
    enabled: Boolean(participantId.trim()),
  })
  const workflows = (workflowsQuery.data ?? []).map(toEmailWorkflow).sort((a, b) => {
    const rank = (status: string) => (status === 'waiting' ? 0 : status === 'running' ? 1 : 2)
    return rank(a.status) - rank(b.status)
  })

  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const effectiveSelected =
    selectedWorkflow ??
    workflows.find((workflow) => workflow.status === 'waiting' || workflow.status === 'running')
      ?.workflowVersionId ??
    workflows[0]?.workflowVersionId ??
    null

  const inboxQuery = useQuery({
    queryKey: ['email-inbox', participantId, effectiveSelected],
    queryFn: () => getEmailInbox(participantId, effectiveSelected!),
    enabled: Boolean(participantId.trim() && effectiveSelected),
  })
  const threads = (inboxQuery.data ?? []).map(toEmailThread)

  const [selectedRootId, setSelectedRootId] = useState<string | null>(null)
  const [readPendingThreads, setReadPendingThreads] = useState<ReadonlySet<string>>(new Set())

  const threadMessagesQuery = useQuery({
    queryKey: ['email-thread-messages', participantId, effectiveSelected, selectedRootId],
    queryFn: () => getEmailThreadMessages(participantId, effectiveSelected!, selectedRootId!),
    enabled: Boolean(
      participantId.trim() &&
        effectiveSelected &&
        selectedRootId &&
        !readPendingThreads.has(selectedRootId),
    ),
  })

  const visibleMessages: EmailMessage[] = (threadMessagesQuery.data ?? []).map(toEmailMessage)

  const selectedThread = threads.find((t) => t.rootId === selectedRootId) ?? null

  const selectedRun = workflows.find((workflow) => workflow.workflowVersionId === effectiveSelected)
  const canReply = Boolean(
    selectedRun && (selectedRun.status === 'waiting' || selectedRun.status === 'running'),
  )
  const disabled = isEmailPending || !canReply

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!effectiveSelected || !selectedThread) return
    sendEmail({
      workflowVersionId: effectiveSelected,
      target: selectedThread.latestSenderId,
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
        workflows={workflows}
        selectedWorkflow={effectiveSelected}
        onSelectWorkflow={(workflowVersionId) => {
          setSelectedWorkflow(workflowVersionId)
          setSelectedRootId(null)
        }}
        selectedRootId={selectedRootId}
        onSelectThread={setSelectedRootId}
        selectedThread={selectedThread}
        disabled={disabled}
        onSubmit={submit}
        onConversationOpen={(rootId) => {
          if (!effectiveSelected) return
          const thread = threads.find((t) => t.rootId === rootId)
          if (thread && thread.unreadCount > 0) {
            setReadPendingThreads((prev) => new Set(prev).add(rootId))
            void markEmailThreadRead(effectiveSelected, rootId).finally(() =>
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
