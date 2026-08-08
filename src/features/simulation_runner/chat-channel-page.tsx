import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { getChatMessages } from '../../shared/api/chat'
import { getMasterData } from '../../shared/api/master-data'
import { getPublishedVersions } from '../../shared/api/workflows'
import { ChatWorkspace } from './chat/chat-workspace'
import type { ChatMessage, ChatWorkflow } from './chat/types'
import { useSimulationRun } from './simulation-run-context'

export function ChatChannelPage() {
  const { participantId, runnerParticipantId, sessionId, runs, isChatPending, sendChat, markChatRead } = useSimulationRun()
  const versions = useQuery({ queryKey: ['published-versions'], queryFn: getPublishedVersions })
  const actors = useQuery({ queryKey: ['master', 'actors'], queryFn: () => getMasterData('actors') })
  const chatQuery = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => getChatMessages(sessionId!),
    enabled: Boolean(sessionId),
  })

  const events: ChatMessage[] = (chatQuery.data ?? []).map((message) => ({
    message_id: message.participant_chat_id,
    from: message.sender_id,
    to: message.sender_type === 'participant' ? message.chat_partner_id : participantId,
    actor: message.sender_id,
    channel: 'chat' as const,
    chat_id: null,
    action_type: 'message',
    content: message.content,
    timestamp: message.created_date,
    is_read: message.is_read,
    session_id: message.session_id,
    workflow_version_id: message.workflow_version_id ?? undefined,
    is_unread: message.is_read === false,
  }))

  const versionById = new Map((versions.data ?? []).map((item) => [item.workflow_version_id, item]))
  const workflows: ChatWorkflow[] = runs
    .map((run) => {
      const version = versionById.get(run.workflow_version_id)
      const unreadCount = events.filter(
        (event) => event.workflow_version_id === run.workflow_version_id && event.from !== runnerParticipantId && event.is_unread,
      ).length
      return {
        workflowVersionId: run.workflow_version_id,
        workflowName: version?.workflow_name ?? run.workflow_version_id.slice(0, 8),
        versionNumber: version?.version_number ?? 0,
        status: run.status,
        unreadCount,
      }
    })
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

  const visibleMessages = effectiveSelected
    ? events.filter((event) => !event.workflow_version_id || event.workflow_version_id === effectiveSelected)
    : events

  const selectedRun = runs.find((run) => run.workflow_version_id === effectiveSelected)
  const canReply = Boolean(selectedRun && (selectedRun.status === 'waiting' || selectedRun.status === 'running'))
  const disabled = isChatPending || !canReply

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!effectiveSelected) return
    sendChat({ workflowVersionId: effectiveSelected, target: String(data.get('target') ?? ''), content: String(data.get('content') ?? '') })
    event.currentTarget.reset()
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ChatWorkspace
        participantId={participantId}
        messages={visibleMessages}
        actors={actors.data ?? []}
        workflows={workflows}
        selectedWorkflow={effectiveSelected}
        onSelectWorkflow={setSelectedWorkflow}
        disabled={disabled}
        onSubmit={submit}
        onConversationOpen={(messages) => {
          for (const message of messages) {
            if (message.message_id && message.session_id && message.from !== runnerParticipantId && message.is_unread) {
              markChatRead(message.session_id, message.message_id)
            }
          }
        }}
      />
    </div>
  )
}
