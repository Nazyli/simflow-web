import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { getChatActors, getChatMessages, getChatWorkflows, type ChatActorItem, type ChatMessage as ApiChatMessage, type ChatWorkflowItem } from '../../shared/api/chat'
import { ChatWorkspace } from './chat/chat-workspace'
import type { ChatActor, ChatMessage, ChatWorkflow } from './chat/types'
import { useSimulationRun } from './simulation-run-context'

export function ChatChannelPage() {
  const { participantId, runnerParticipantId, isChatPending, sendChat, markChatRead } = useSimulationRun()

  const toChatMessage = (message: ApiChatMessage): ChatMessage => ({
    message_id: message.participant_chat_id,
    from: message.sender_id,
    to: message.sender_type === 'participant' ? message.chat_partner_id : runnerParticipantId,
    actor: message.sender_id,
    channel: 'chat' as const,
    chat_id: null,
    action_type: 'message',
    content: message.content,
    timestamp: message.created_date,
    session_id: message.session_id,
    workflow_version_id: message.workflow_version_id ?? undefined,
    is_unread: message.is_read === false,
  })

  const toChatWorkflow = (item: ChatWorkflowItem): ChatWorkflow => ({
    workflowVersionId: item.workflow_version_id,
    workflowName: item.workflow_name,
    versionNumber: item.version_number,
    status: item.status,
    unreadCount: item.unread_count,
  })

  const toChatActor = (item: ChatActorItem): ChatActor => ({
    actorId: item.actor_id,
    actorName: item.actor_name,
    unreadCount: item.unread_count,
  })

  const workflowsQuery = useQuery({
    queryKey: ['chat-workflows', participantId],
    queryFn: () => getChatWorkflows(participantId),
    enabled: Boolean(participantId.trim()),
  })
  const workflows = (workflowsQuery.data ?? [])
    .map(toChatWorkflow)
    .sort((a, b) => {
      const rank = (status: string) => (status === 'waiting' ? 0 : status === 'running' ? 1 : 2)
      return rank(a.status) - rank(b.status)
    })

  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const effectiveSelected =
    selectedWorkflow ??
    workflows.find((workflow) => workflow.status === 'waiting' || workflow.status === 'running')?.workflowVersionId ??
    workflows[0]?.workflowVersionId ??
    null

  const actorsQuery = useQuery({
    queryKey: ['chat-actors', participantId, effectiveSelected],
    queryFn: () => getChatActors(participantId, effectiveSelected!),
    enabled: Boolean(participantId.trim() && effectiveSelected),
  })
  const actors = (actorsQuery.data ?? []).map(toChatActor)

  const [selectedActor, setSelectedActor] = useState<string | null>(null)

  const chatQuery = useQuery({
    queryKey: ['chat-messages', participantId, effectiveSelected, selectedActor],
    queryFn: () => getChatMessages(participantId, effectiveSelected!, selectedActor!),
    enabled: Boolean(participantId.trim() && effectiveSelected && selectedActor),
  })

  const visibleMessages: ChatMessage[] = (chatQuery.data ?? []).map(toChatMessage)

  const selectedRun = workflows.find((workflow) => workflow.workflowVersionId === effectiveSelected)
  const canReply = Boolean(selectedRun && (selectedRun.status === 'waiting' || selectedRun.status === 'running'))
  const disabled = isChatPending || !canReply

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!effectiveSelected || !selectedActor) return
    sendChat({ workflowVersionId: effectiveSelected, target: selectedActor, content: String(data.get('content') ?? '') })
    event.currentTarget.reset()
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ChatWorkspace
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
          if (actor && actor.unreadCount > 0) markChatRead(effectiveSelected, actorId)
        }}
      />
    </div>
  )
}
