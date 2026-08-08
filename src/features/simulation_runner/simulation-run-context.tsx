import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { markChatMessageRead, sendParticipantChat } from '../../shared/api/chat'
import { eventsUrl } from '../../shared/api/client'
import { getExecution, getExecutionState, submitExecutionAction, type BatchExecutionRun } from '../../shared/api/executions'
import { getSessionsForParticipant, type SimulationSessionSummary } from '../../shared/api/sessions'
import { getPublishedVersions, type PublishedWorkflowVersion } from '../../shared/api/workflows'
import type { Execution } from '../../shared/types/workflow'
import type { Channel } from './channel-workspaces'

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

export interface ChannelActionInput {
  channel: 'email' | 'call' | 'document'
  target: string
  content: string
}

export interface SimulationRunContextValue {
  participantId: string
  sessions: SimulationSessionSummary[]
  runs: BatchExecutionRun[]
  activeExecution: Execution | null
  activeWorkflow: PublishedWorkflowVersion | null
  unreadCounts: Record<Channel, number>
  waitingRuns: BatchExecutionRun[]
  waitingForRead: boolean
  deferredReadWait: { nodeExecutionId: string; messageId: string } | null
  runnerParticipantId: string
  isChannelActionPending: boolean
  isChatPending: boolean
  submitChannelAction: (input: ChannelActionInput) => void
  sendChat: (input: { target: string; content: string }) => void
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
  const [runs, setRuns] = useState<BatchExecutionRun[]>([])
  const [activeExecution, setActiveExecution] = useState<Execution | null>(null)

  const versions = useQuery({ queryKey: ['published-versions'], queryFn: getPublishedVersions })
  const sessionsQuery = useQuery({ queryKey: ['participant-sessions', participantId], queryFn: () => getSessionsForParticipant(participantId), enabled: Boolean(participantId.trim()) })
  const sessions = sessionsQuery.data ?? []

  const savedExecutionQueries = useQueries({ queries: sessions.filter((session) => session.execution_id).map((session) => ({ queryKey: ['runner-execution', session.execution_id], queryFn: () => getExecution(session.execution_id!), enabled: Boolean(participantId.trim() && !runs.length) })) })

  useEffect(() => {
    if (runs.length || !savedExecutionQueries.length || !savedExecutionQueries.every((query) => query.isSuccess)) return
    const restoredRuns = savedExecutionQueries.flatMap((query) => query.data ? [{ ...query.data, outcome: 'resumed' as const }] : [])
    const selected = restoredRuns.find((run) => run.status === 'waiting' || run.status === 'running') ?? restoredRuns[0]
    if (!selected) return
    setRuns(restoredRuns)
    setActiveExecution(selected)
  }, [activeExecution, runs.length, savedExecutionQueries])

  useEffect(() => {
    const streamParticipantId = participantId.trim()
    if (!streamParticipantId) return
    const events = new EventSource(eventsUrl(streamParticipantId))
    const refreshRunner = (event: Event) => {
      void client.invalidateQueries({ queryKey: ['participant-sessions', streamParticipantId] })
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

  const executionStateQueries = useQueries({ queries: runs.map((run) => ({ queryKey: ['execution-state', run.execution_id], queryFn: () => getExecutionState(run.execution_id) })) })
  const executionStates = executionStateQueries.flatMap((query) => query.data ? [query.data] : [])
  const executionStateKey = JSON.stringify(executionStates)
  useEffect(() => {
    if (!executionStates.length) return
    setActiveExecution((current) => {
      const state = executionStates.find((item) => item.execution_id === current?.execution_id)
      return current && state ? { ...current, status: state.status, current_node_id: state.current_node_id, context: { ...current.context, active_wait: state.active_wait ?? undefined } } : current
    })
    setRuns((current) => current.map((run) => {
      const state = executionStates.find((item) => item.execution_id === run.execution_id)
      return state ? { ...run, status: state.status, current_node_id: state.current_node_id, context: { ...run.context, active_wait: state.active_wait ?? undefined } } : run
    }))
  }, [executionStateKey])

  const action = useMutation({
    mutationFn: ({ executionId, channel, target, content, actionType }: { executionId: string; channel: Channel; target: string; content: string; actionType: string }) => submitExecutionAction(executionId, { action_type: actionType, actor_id: actorId, payload: { channel, content, to: target, document_id: channel === 'document' ? target : undefined } }),
    onSuccess: async (result) => {
      await client.refetchQueries({ queryKey: ['channel-history'] })
      setActiveExecution(result)
      setRuns((current) => current.map((run) => run.execution_id === result.execution_id ? { ...run, ...result } : run))
      client.invalidateQueries({ queryKey: ['participant-sessions', participantId.trim()] })
      toast.success('Workflow action submitted.')
    },
    onError: () => toast.error('Action was rejected. Check the requested channel and target.'),
  })

  const chatAction = useMutation({
    mutationFn: ({ sessionId, target, content }: { sessionId: string; target: string; content: string }) => sendParticipantChat(sessionId, target, content),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['chat-messages'] })
      client.invalidateQueries({ queryKey: ['participant-sessions', participantId.trim()] })
    },
  })

  const messageRead = useMutation({
    mutationFn: ({ sessionId, messageId }: { sessionId: string; messageId: string }) => markChatMessageRead(sessionId, messageId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['chat-messages'] })
      client.invalidateQueries({ queryKey: ['participant-sessions', participantId.trim()] })
    },
  })

  const waitingRuns = runs.filter((run) => run.status === 'waiting' && typeof run.context.active_wait === 'object')
  const waitingForRead = waitingRuns.some((run) => (run.context.active_wait as Record<string, unknown>).waits_for_read === true)
  const activeWait = activeExecution?.context.active_wait
  const deferredReadWait = activeWait && typeof activeWait === 'object' && typeof (activeWait as Record<string, unknown>).node_execution_id === 'string' && typeof (activeWait as Record<string, unknown>).message_id === 'string'
    ? { nodeExecutionId: (activeWait as Record<string, string>).node_execution_id, messageId: (activeWait as Record<string, string>).message_id }
    : null
  const runnerParticipantId = actorId || activeExecution?.participant_id || participantId
  const unreadCounts = Object.fromEntries(CHANNELS.map((channel) => [channel, sessions.reduce((total, session) => total + (session.unread_counts[channel] ?? 0), 0)])) as Record<Channel, number>
  const activeWorkflow = (versions.data ?? []).find((item) => item.workflow_version_id === activeExecution?.workflow_version_id) ?? null

  function resolveRun(channel: Channel): Execution | null {
    return channel === 'chat' ? activeExecution : waitingRuns.length === 1 ? waitingRuns[0] : activeExecution
  }

  const submitChannelAction = (input: ChannelActionInput) => {
    const run = resolveRun(input.channel)
    if (!run) {
      toast.error('Choose the workflow that is waiting for this action.')
      return
    }
    const actionType = input.channel === 'email' ? 'message' : input.channel === 'call' ? 'finish_call' : 'close_document'
    action.mutate({ executionId: run.execution_id, channel: input.channel, target: input.target, content: input.content, actionType })
  }

  const sendChat = (input: { target: string; content: string }) => {
    const run = resolveRun('chat')
    if (!run?.session_id) {
      toast.error('Choose an active simulation session.')
      return
    }
    chatAction.mutate({ sessionId: run.session_id, target: input.target, content: input.content })
  }

  const refresh = () => {
    client.invalidateQueries({ queryKey: ['participant-sessions', participantId.trim()] })
    client.invalidateQueries({ queryKey: ['chat-messages'] })
  }

  return (
    <SimulationRunContext.Provider value={{
      participantId,
      sessions,
      runs,
      activeExecution,
      activeWorkflow,
      unreadCounts,
      waitingRuns,
      waitingForRead,
      deferredReadWait,
      runnerParticipantId,
      isChannelActionPending: action.isPending,
      isChatPending: chatAction.isPending,
      submitChannelAction,
      sendChat,
      markChatRead: (sessionId, messageId) => messageRead.mutate({ sessionId, messageId }),
      refresh,
    }}>
      {children}
    </SimulationRunContext.Provider>
  )
}
