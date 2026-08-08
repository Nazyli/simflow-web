import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { markChatMessageRead, sendParticipantChat } from '../../shared/api/chat'
import { eventsUrl } from '../../shared/api/client'
import { getExecutionState, getSessionExecutions } from '../../shared/api/executions'
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
  markChatRead: (sessionId: string, messageId: string) => void
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

  const executionStates = useQuery({
    queryKey: ['execution-states', runs.map((run) => run.execution_id).join(',')],
    queryFn: async () => Promise.all(runs.map((run) => getExecutionState(run.execution_id))),
    enabled: runs.length > 0,
  }).data ?? []
  const mergedRuns = runs.map((run) => {
    const state = executionStates.find((item) => item.execution_id === run.execution_id)
    return state
      ? { ...run, status: state.status, current_node_id: state.current_node_id, context: { ...run.context, active_wait: state.active_wait ?? undefined } }
      : run
  })
  const activeExecution = mergedRuns.find((run) => run.status === 'waiting' || run.status === 'running') ?? mergedRuns[0] ?? null

  useEffect(() => {
    const streamParticipantId = participantId.trim()
    if (!streamParticipantId) return
    const events = new EventSource(eventsUrl(streamParticipantId))
    const refreshRunner = (event: Event) => {
      void client.invalidateQueries({ queryKey: ['participant-sessions', streamParticipantId] })
      void client.invalidateQueries({ queryKey: ['session-executions'] })
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
    mutationFn: ({ sessionId, workflowVersionId, target, content }: { sessionId: string; workflowVersionId: string; target: string; content: string }) =>
      sendParticipantChat(sessionId, target, content, workflowVersionId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['chat-messages'] })
      client.invalidateQueries({ queryKey: ['session-executions'] })
      client.invalidateQueries({ queryKey: ['participant-sessions', participantId.trim()] })
    },
    onError: () => toast.error('Reply was rejected. Check the requested actor and workflow.'),
  })

  const messageRead = useMutation({
    mutationFn: ({ sessionId, messageId }: { sessionId: string; messageId: string }) => markChatMessageRead(sessionId, messageId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['chat-messages'] })
      client.invalidateQueries({ queryKey: ['session-executions'] })
      client.invalidateQueries({ queryKey: ['participant-sessions', participantId.trim()] })
    },
  })

  const runnerParticipantId = actorId || activeExecution?.participant_id || participantId
  const unreadCounts = Object.fromEntries(CHANNELS.map((channel) => [channel, sessions.reduce((total, session) => total + (session.unread_counts[channel] ?? 0), 0)])) as Record<Channel, number>
  const activeWorkflow = (versions.data ?? []).find((item) => item.workflow_version_id === activeExecution?.workflow_version_id) ?? null

  const sendChat = (input: { workflowVersionId: string; target: string; content: string }) => {
    if (!sessionId) {
      toast.error('Choose an active simulation session.')
      return
    }
    chatAction.mutate({ sessionId, workflowVersionId: input.workflowVersionId, target: input.target, content: input.content })
  }

  const refresh = () => {
    client.invalidateQueries({ queryKey: ['participant-sessions', participantId.trim()] })
    client.invalidateQueries({ queryKey: ['session-executions'] })
    client.invalidateQueries({ queryKey: ['chat-messages'] })
  }

  return (
    <SimulationRunContext.Provider value={{
      participantId,
      sessions,
      sessionId,
      runs: mergedRuns,
      activeExecution,
      activeWorkflow,
      unreadCounts,
      runnerParticipantId,
      isChatPending: chatAction.isPending,
      sendChat,
      markChatRead: (sessionId, messageId) => messageRead.mutate({ sessionId, messageId }),
      refresh,
    }}>
      {children}
    </SimulationRunContext.Provider>
  )
}
