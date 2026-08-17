import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import {
  getEmailActors,
  getEmailMessages,
  getEmailWorkflows,
  type EmailActorItem,
  type EmailMessage as ApiEmailMessage,
  type EmailWorkflowItem,
} from '../../shared/api/email'
import { EmailWorkspace } from './email/email-workspace'
import type { EmailActor, EmailMessage, EmailWorkflow } from './email/types'
import { useSimulationRun } from './simulation-run-context'

export function EmailChannelPage() {
  const { participantId, runnerParticipantId, isEmailPending, sendEmail, markEmailRead } =
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

  const toEmailActor = (item: EmailActorItem): EmailActor => ({
    actorId: item.actor_id,
    actorName: item.actor_name,
    unreadCount: item.unread_count,
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

  const actorsQuery = useQuery({
    queryKey: ['email-actors', participantId, effectiveSelected],
    queryFn: () => getEmailActors(participantId, effectiveSelected!),
    enabled: Boolean(participantId.trim() && effectiveSelected),
  })
  const actors = (actorsQuery.data ?? []).map(toEmailActor)

  const [selectedActor, setSelectedActor] = useState<string | null>(null)
  const [readPendingActors, setReadPendingActors] = useState<ReadonlySet<string>>(new Set())

  const emailQuery = useQuery({
    queryKey: ['email-messages', participantId, effectiveSelected, selectedActor],
    queryFn: () => getEmailMessages(participantId, effectiveSelected!, selectedActor!),
    enabled: Boolean(
      participantId.trim() &&
      effectiveSelected &&
      selectedActor &&
      !readPendingActors.has(selectedActor),
    ),
  })

  const visibleMessages: EmailMessage[] = (emailQuery.data ?? []).map(toEmailMessage)

  const selectedRun = workflows.find((workflow) => workflow.workflowVersionId === effectiveSelected)
  const canReply = Boolean(
    selectedRun && (selectedRun.status === 'waiting' || selectedRun.status === 'running'),
  )
  const disabled = isEmailPending || !canReply

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!effectiveSelected || !selectedActor) return
    sendEmail({
      workflowVersionId: effectiveSelected,
      target: selectedActor,
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
        actors={actors}
        workflows={workflows}
        selectedWorkflow={effectiveSelected}
        onSelectWorkflow={(workflowVersionId) => {
          setSelectedWorkflow(workflowVersionId)
          setSelectedActor(null)
        }}
        selectedActor={selectedActor}
        onSelectActor={setSelectedActor}
        disabled={disabled}
        onSubmit={submit}
        onConversationOpen={(actorId) => {
          if (!effectiveSelected) return
          const actor = actors.find((item) => item.actorId === actorId)
          if (actor && actor.unreadCount > 0) {
            setReadPendingActors((prev) => new Set(prev).add(actorId))
            void markEmailRead(effectiveSelected, actorId).finally(() =>
              setReadPendingActors((prev) => {
                const next = new Set(prev)
                next.delete(actorId)
                return next
              }),
            )
          }
        }}
      />
    </div>
  )
}
