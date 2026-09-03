import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  getChatActors,
  getChatMessages,
  getChatSimulations,
  type ChatActorItem,
  type ChatMessage as ApiChatMessage,
  type ChatSimulationItem,
} from '../../shared/api/chat'
import { eventsUrl } from '../../shared/api/client'
import { ChatWorkspace } from './chat/chat-workspace'
import type { ChatActor, ChatMessage, ChatSimulation } from './chat/types'
import { useSimulationRun } from './simulation-run-context'

export function ChatChannelPage() {
  const { participantId, runnerParticipantId, isChatPending, sendChat, markChatRead } =
    useSimulationRun()

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
    simulation_id: message.simulation_id ?? undefined,
    is_unread: message.is_read === false,
  })

  const toChatSimulation = (item: ChatSimulationItem): ChatSimulation => ({
    simulationId: item.simulation_id,
    groupSimulationName: item.group_simulation_name,
    versionNumber: item.version_number,
    status: item.status,
    unreadCount: item.unread_count,
  })

  const toChatActor = (item: ChatActorItem): ChatActor => ({
    actorId: item.actor_id,
    actorName: item.actor_name,
    unreadCount: item.unread_count,
  })

  const simulationsQuery = useQuery({
    queryKey: ['chat-simulations', participantId],
    queryFn: () => getChatSimulations(participantId),
    enabled: Boolean(participantId.trim()),
  })
  const simulations = (simulationsQuery.data ?? []).map(toChatSimulation).sort((a, b) => {
    const rank = (status: string) => (status === 'waiting' ? 0 : status === 'running' ? 1 : 2)
    return rank(a.status) - rank(b.status)
  })

  const [selectedSimulation, setSelectedSimulation] = useState<string | null>(null)
  const effectiveSelected =
    selectedSimulation ??
    simulations.find((s) => s.status === 'waiting' || s.status === 'running')?.simulationId ??
    simulations[0]?.simulationId ??
    null

  const actorsQuery = useQuery({
    queryKey: ['chat-actors', participantId, effectiveSelected],
    queryFn: () => getChatActors(participantId, effectiveSelected!),
    enabled: Boolean(participantId.trim() && effectiveSelected),
  })
  const actors = (actorsQuery.data ?? []).map(toChatActor)

  const [selectedActor, setSelectedActor] = useState<string | null>(null)
  const [readPendingActors, setReadPendingActors] = useState<ReadonlySet<string>>(new Set())

  const markChatReadRef = useRef(markChatRead)
  markChatReadRef.current = markChatRead

  useEffect(() => {
    const pid = participantId.trim()
    if (!pid || !selectedActor || !effectiveSelected) return
    const events = new EventSource(eventsUrl(pid))
    const handleNotification = (event: Event) => {
      if (!(event instanceof MessageEvent)) return
      try {
        const payload = JSON.parse(event.data) as {
          type?: string
          message?: {
            sender_type?: string
            sender_id?: string
            simulation_id?: string
            is_read?: boolean
          }
        }
        if (
          payload.type === 'chat_message' &&
          payload.message?.sender_type === 'actor' &&
          payload.message.is_read === false &&
          payload.message.sender_id === selectedActor &&
          payload.message.simulation_id === effectiveSelected
        ) {
          setReadPendingActors((prev) => {
            if (prev.has(selectedActor)) return prev
            const next = new Set(prev)
            next.add(selectedActor)
            return next
          })
          void markChatReadRef.current(effectiveSelected, selectedActor).finally(() =>
            setReadPendingActors((prev) => {
              const next = new Set(prev)
              next.delete(selectedActor)
              return next
            }),
          )
        }
      } catch {
        // Ignore malformed SSE payloads.
      }
    }
    events.addEventListener('notification', handleNotification)
    return () => events.close()
  }, [participantId, selectedActor, effectiveSelected])

  const chatQuery = useQuery({
    queryKey: ['chat-messages', participantId, effectiveSelected, selectedActor],
    queryFn: () => getChatMessages(participantId, effectiveSelected!, selectedActor!),
    enabled: Boolean(
      participantId.trim() &&
      effectiveSelected &&
      selectedActor &&
      !readPendingActors.has(selectedActor),
    ),
  })

  const visibleMessages: ChatMessage[] = (chatQuery.data ?? []).map(toChatMessage)

  const selectedRun = simulations.find((s) => s.simulationId === effectiveSelected)
  const canReply = Boolean(
    selectedRun && (selectedRun.status === 'waiting' || selectedRun.status === 'running'),
  )
  const disabled = isChatPending || !canReply

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!effectiveSelected || !selectedActor) return
    sendChat({
      simulationId: effectiveSelected,
      target: selectedActor,
      content: String(data.get('content') ?? ''),
    })
    event.currentTarget.reset()
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ChatWorkspace
        participantId={runnerParticipantId}
        messages={visibleMessages}
        actors={actors}
        simulations={simulations}
        selectedSimulation={effectiveSelected}
        onSelectSimulation={(simulationId) => {
          setSelectedSimulation(simulationId)
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
            void markChatRead(effectiveSelected, actorId).finally(() =>
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
