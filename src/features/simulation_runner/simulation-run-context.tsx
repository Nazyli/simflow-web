import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  markChatMessageRead,
  sendParticipantChat,
  type ChatActorItem,
  type ChatMarkAsReadResult,
  type ChatMessage,
  type ChatWorkflowItem,
} from '../../shared/api/chat'
import { eventsUrl } from '../../shared/api/client'
import { getSessionExecutions } from '../../shared/api/executions'
import { getSessionsForParticipant, type SimulationSessionSummary } from '../../shared/api/sessions'
import { getPublishedVersions, type PublishedWorkflowVersion } from '../../shared/api/workflows'
import type { Execution } from '../../shared/types/workflow'
import type { Channel } from './simulation-channels'

export const ACTOR_STORAGE_KEY = 'simflow-runner-actor-id'
export const DEFAULT_ACTOR_ID = 'participant-001-ambj-01-platform'
export function readActorId(): string {
  try {
    return localStorage.getItem(ACTOR_STORAGE_KEY) ?? DEFAULT_ACTOR_ID
  } catch {
    return DEFAULT_ACTOR_ID
  }
}
export function writeActorId(actorId: string): void {
  try {
    localStorage.setItem(ACTOR_STORAGE_KEY, actorId)
  } catch {
    // Ignore storage failures; the default actor id is used as a fallback.
  }
}

const CHANNELS: Channel[] = ['chat', 'email', 'call', 'document']

export interface SimulationRunContextValue {
  participantId: string
  sessions: SimulationSessionSummary[]
  sessionId: string | null
  runs: Execution[]
  activeExecution: Execution | null
  activeWorkflow: PublishedWorkflowVersion | null
  unreadCounts: Record<Channel, number>
  runnerParticipantId: string
  isChatPending: boolean
  sendChat: (input: { workflowVersionId: string; target: string; content: string }) => void
  markChatRead: (workflowVersionId: string, actorId: string) => Promise<ChatMarkAsReadResult>
  refresh: () => void
}

const SimulationRunContext = createContext<SimulationRunContextValue | null>(null)

export function useSimulationRun(): SimulationRunContextValue {
  const value = useContext(SimulationRunContext)
  if (!value) throw new Error('useSimulationRun must be used within SimulationRunProvider')
  return value
}

export function SimulationRunProvider({ participantId, children }: { participantId: string; children: ReactNode }) {
  const client = useQueryClient()
  const [actorId] = useState(readActorId)

  const versions = useQuery({ queryKey: ['published-versions'], queryFn: getPublishedVersions })
  const sessionsQuery = useQuery({
    queryKey: ['participant-sessions', participantId],
    queryFn: () => getSessionsForParticipant(participantId),
    enabled: Boolean(participantId.trim()),
  })
  const sessions = sessionsQuery.data ?? []
  const sessionId = sessions[0]?.session_id ?? null

  const runsQuery = useQuery({
    queryKey: ['session-executions', sessionId],
    queryFn: () => getSessionExecutions(sessionId!),
    enabled: Boolean(sessionId),
  })
  const runs = runsQuery.data ?? []
  const activeExecution = runs.find((run) => run.status === 'waiting' || run.status === 'running') ?? runs[0] ?? null

  useEffect(() => {
    const streamParticipantId = participantId.trim()
    if (!streamParticipantId) return
    const events = new EventSource(eventsUrl(streamParticipantId))
    const refreshRunner = (event: Event) => {
      void client.invalidateQueries({ queryKey: ['participant-sessions', streamParticipantId] })
      void client.invalidateQueries({ queryKey: ['session-executions'] })
      void client.invalidateQueries({ queryKey: ['chat-workflows'] })
      void client.invalidateQueries({ queryKey: ['chat-actors'] })
      void client.invalidateQueries({ queryKey: ['chat-messages'] })
      if (!(event instanceof MessageEvent)) return
      try {
        const payload = JSON.parse(event.data) as { type?: string; message?: { sender_type?: string; sender_id?: string; content?: string; is_read?: boolean } }
        if (payload.type === 'chat_message' && payload.message?.sender_type === 'actor' && payload.message.is_read === false) {
          toast.info(`New message from ${payload.message.sender_id ?? 'actor'}`, { description: payload.message.content })
        }
      } catch {
        // Ignore malformed SSE payloads while still refreshing server state.
      }
    }
    events.addEventListener('notification', refreshRunner)
    return () => events.close()
  }, [client, participantId])

  const chatAction = useMutation({
    mutationFn: ({ workflowVersionId, target, content }: { workflowVersionId: string; target: string; content: string }) =>
      sendParticipantChat(participantId.trim(), target, content, workflowVersionId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['chat-messages'] })
      client.invalidateQueries({ queryKey: ['chat-workflows'] })
      client.invalidateQueries({ queryKey: ['chat-actors'] })
      client.invalidateQueries({ queryKey: ['session-executions'] })
      client.invalidateQueries({ queryKey: ['participant-sessions', participantId.trim()] })
    },
    onError: () => toast.error('Reply was rejected. Check the requested actor and workflow.'),
  })

  const messageRead = useMutation({
    mutationFn: ({ workflowVersionId, actorId }: { workflowVersionId: string; actorId: string }) =>
      markChatMessageRead(participantId.trim(), workflowVersionId, actorId),
    onSuccess: ({ count }, { workflowVersionId, actorId }) => {
      const pid = participantId.trim()
      client.setQueryData<ChatMessage[]>(['chat-messages', pid, workflowVersionId, actorId], (messages) =>
        messages?.map((message) =>
          message.sender_type === 'actor' && !message.is_read
            ? { ...message, is_read: true, read_at: message.read_at ?? new Date().toISOString() }
            : message,
        ),
      )
      client.setQueryData<ChatActorItem[]>(['chat-actors', pid, workflowVersionId], (actors) =>
        actors?.map((actor) => (actor.actor_id === actorId ? { ...actor, unread_count: Math.max(0, actor.unread_count - count) } : actor)),
      )
      client.setQueryData<ChatWorkflowItem[]>(['chat-workflows', pid], (workflows) =>
        workflows?.map((workflow) =>
          workflow.workflow_version_id === workflowVersionId ? { ...workflow, unread_count: Math.max(0, workflow.unread_count - count) } : workflow,
        ),
      )
      client.setQueryData<SimulationSessionSummary[]>(['participant-sessions', pid], (sessions) =>
        sessions?.map((session) => ({
          ...session,
          unread_counts: { ...session.unread_counts, chat: Math.max(0, (session.unread_counts.chat ?? 0) - count) },
        })),
      )
      client.invalidateQueries({ queryKey: ['session-executions'] })
    },
  })

  const runnerParticipantId = actorId || activeExecution?.participant_id || participantId
  const unreadCounts = Object.fromEntries(CHANNELS.map((channel) => [channel, sessions.reduce((total, session) => total + (session.unread_counts[channel] ?? 0), 0)])) as Record<Channel, number>
  const activeWorkflow = (versions.data ?? []).find((item) => item.workflow_version_id === activeExecution?.workflow_version_id) ?? null

  const sendChat = (input: { workflowVersionId: string; target: string; content: string }) => {
    if (!participantId.trim()) {
      toast.error('Choose an active simulation session.')
      return
    }
    chatAction.mutate({ workflowVersionId: input.workflowVersionId, target: input.target, content: input.content })
  }

  const refresh = () => {
    client.invalidateQueries({ queryKey: ['participant-sessions', participantId.trim()] })
    client.invalidateQueries({ queryKey: ['session-executions'] })
    client.invalidateQueries({ queryKey: ['chat-workflows'] })
    client.invalidateQueries({ queryKey: ['chat-actors'] })
    client.invalidateQueries({ queryKey: ['chat-messages'] })
  }

  return (
    <SimulationRunContext.Provider value={{
      participantId,
      sessions,
      sessionId,
      runs,
      activeExecution,
      activeWorkflow,
      unreadCounts,
      runnerParticipantId,
      isChatPending: chatAction.isPending,
      sendChat,
      markChatRead: (workflowVersionId, actorId) => messageRead.mutateAsync({ workflowVersionId, actorId }),
      refresh,
    }}>
      {children}
    </SimulationRunContext.Provider>
  )
}
