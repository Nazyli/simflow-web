import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  markChatMessageRead,
  sendParticipantChat,
  type ChatActorItem,
  type ChatMarkAsReadResult,
  type ChatMessage,
  type ChatSimulationItem,
} from '../../shared/api/chat'
import { eventsUrl } from '../../shared/api/client'
import {
  markEmailThreadAsRead,
  sendParticipantEmail,
  type EmailMarkAsReadResult,
  type ParticipantEmailAttachmentInput,
} from '../../shared/api/email'
import { getNotificationActivity, type NotificationActivity } from '../../shared/api/notifications'
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
  unreadCounts: Record<Channel, number>
  runnerParticipantId: string
  isChatPending: boolean
  sendChat: (input: { simulationId: string; target: string; content: string }) => void
  markChatRead: (simulationId: string, actorId: string) => Promise<ChatMarkAsReadResult>
  isEmailPending: boolean
  sendEmail: (input: {
    simulationId: string
    target: string
    subject: string
    content: string
    parentEmailId?: string
    replyToEmailId?: string
    attachments?: ParticipantEmailAttachmentInput[]
  }) => void
  markEmailThreadRead: (simulationId: string, rootId: string) => Promise<EmailMarkAsReadResult>
  refresh: () => void
}

const SimulationRunContext = createContext<SimulationRunContextValue | null>(null)

export function useSimulationRun(): SimulationRunContextValue {
  const value = useContext(SimulationRunContext)
  if (!value) throw new Error('useSimulationRun must be used within SimulationRunProvider')
  return value
}

export function SimulationRunProvider({
  participantId,
  children,
}: {
  participantId: string
  children: ReactNode
}) {
  const client = useQueryClient()
  const [actorId] = useState(readActorId)

  const activityQuery = useQuery({
    queryKey: ['notification-activity', participantId],
    queryFn: () => getNotificationActivity(participantId),
    enabled: Boolean(participantId.trim()),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
  const activity = activityQuery.data ?? { activity_chat: [], activity_email: [] }

  useEffect(() => {
    const streamParticipantId = participantId.trim()
    if (!streamParticipantId) return
    const events = new EventSource(eventsUrl(streamParticipantId))
    const refreshRunner = (event: Event) => {
      void client.invalidateQueries({ queryKey: ['notification-activity', streamParticipantId] })
      void client.invalidateQueries({ queryKey: ['participant-executions', streamParticipantId] })
      void client.invalidateQueries({ queryKey: ['chat-simulations'] })
      void client.invalidateQueries({ queryKey: ['chat-actors'] })
      void client.invalidateQueries({ queryKey: ['chat-messages'] })
      void client.invalidateQueries({ queryKey: ['email-inbox'] })
      void client.invalidateQueries({ queryKey: ['email-messages'] })
      void client.invalidateQueries({ queryKey: ['email-thread-messages'] })
      void client.invalidateQueries({ queryKey: ['runner-documents', streamParticipantId] })
      void client.invalidateQueries({ queryKey: ['documents', streamParticipantId] })
      if (!(event instanceof MessageEvent)) return
      try {
        const payload = JSON.parse(event.data) as {
          type?: string
          message?: {
            sender_type?: string
            sender_id?: string
            content?: string
            subject?: string
            is_read?: boolean
          }
        }
        if (
          payload.type === 'chat_message' &&
          payload.message?.sender_type === 'actor' &&
          payload.message.is_read === false
        ) {
          toast.info(`New message from ${payload.message.sender_id ?? 'actor'}`, {
            description: payload.message.content,
          })
        }
        if (
          payload.type === 'email_message' &&
          payload.message?.sender_type === 'actor' &&
          payload.message.is_read === false
        ) {
          toast.info(`New email from ${payload.message.sender_id ?? 'actor'}`, {
            description: payload.message.subject ?? payload.message.content,
          })
        }
      } catch {
        // Ignore malformed SSE payloads while still refreshing server state.
      }
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void client.invalidateQueries({ queryKey: ['notification-activity', streamParticipantId] })
      }
    }
    events.addEventListener('notification', refreshRunner)
    events.onerror = () => {
      void client.invalidateQueries({ queryKey: ['notification-activity', streamParticipantId] })
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      events.close()
    }
  }, [client, participantId])

  const chatAction = useMutation({
    mutationFn: ({
      simulationId,
      target,
      content,
    }: {
      simulationId: string
      target: string
      content: string
    }) => sendParticipantChat(participantId.trim(), target, content, simulationId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['chat-messages'] })
      client.invalidateQueries({ queryKey: ['chat-simulations'] })
      client.invalidateQueries({ queryKey: ['chat-actors'] })
      client.invalidateQueries({ queryKey: ['participant-executions', participantId.trim()] })
      client.invalidateQueries({ queryKey: ['notification-activity', participantId.trim()] })
    },
    onError: () => toast.error('Reply was rejected. Check the requested actor and simulation.'),
  })

  const messageRead = useMutation({
    mutationFn: ({ simulationId, actorId }: { simulationId: string; actorId: string }) =>
      markChatMessageRead(participantId.trim(), simulationId, actorId),
    onSuccess: ({ count }, { simulationId, actorId }) => {
      const pid = participantId.trim()
      client.setQueryData<ChatMessage[]>(
        ['chat-messages', pid, simulationId, actorId],
        (messages) =>
          messages?.map((message) =>
            message.sender_type === 'actor' && !message.is_read
              ? { ...message, is_read: true, read_at: message.read_at ?? new Date().toISOString() }
              : message,
          ),
      )
      client.setQueryData<ChatActorItem[]>(['chat-actors', pid, simulationId], (actors) =>
        actors?.map((actor) =>
          actor.actor_id === actorId
            ? { ...actor, unread_count: Math.max(0, actor.unread_count - count) }
            : actor,
        ),
      )
      client.setQueryData<ChatSimulationItem[]>(['chat-simulations', pid], (simulations) =>
        simulations?.map((simulation) =>
          simulation.simulation_id === simulationId
            ? { ...simulation, unread_count: Math.max(0, simulation.unread_count - count) }
            : simulation,
        ),
      )
      client.setQueryData<NotificationActivity>(['notification-activity', pid], (activity) =>
        activity
          ? {
              ...activity,
              activity_chat: activity.activity_chat
                .map((item) =>
                  item.actor_id === actorId
                    ? { ...item, unread_count: Math.max(0, item.unread_count - count) }
                    : item,
                )
                .filter((item) => item.unread_count > 0),
            }
          : activity,
      )
      client.invalidateQueries({ queryKey: ['notification-activity', pid] })
      client.invalidateQueries({ queryKey: ['participant-executions', pid] })
    },
  })

  const emailAction = useMutation({
    mutationFn: ({
      simulationId,
      target,
      subject,
      content,
      parentEmailId,
      replyToEmailId,
      attachments,
    }: {
      simulationId: string
      target: string
      subject: string
      content: string
      parentEmailId?: string
      replyToEmailId?: string
      attachments?: ParticipantEmailAttachmentInput[]
    }) =>
      sendParticipantEmail(
        participantId.trim(),
        target,
        subject,
        content,
        simulationId,
        undefined,
        undefined,
        parentEmailId,
        replyToEmailId,
        attachments,
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['email-messages'] })
      client.invalidateQueries({ queryKey: ['email-inbox'] })
      client.invalidateQueries({ queryKey: ['email-thread-messages'] })
      client.invalidateQueries({ queryKey: ['participant-executions', participantId.trim()] })
      client.invalidateQueries({ queryKey: ['notification-activity', participantId.trim()] })
    },
    onError: () => toast.error('Email was rejected. Check the requested contact and simulation.'),
  })

  const emailRead = useMutation({
    mutationFn: ({ simulationId, rootId }: { simulationId: string; rootId: string }) =>
      markEmailThreadAsRead(participantId.trim(), simulationId, rootId),
    onSuccess: ({ count }) => {
      const pid = participantId.trim()
      client.setQueryData<NotificationActivity>(['notification-activity', pid], (activity) => {
        if (!activity) return activity
        let remaining = count
        const nextEmail = activity.activity_email
          .map((item) => {
            if (remaining <= 0) return item
            const nextCount = Math.max(0, item.unread_count - remaining)
            remaining -= item.unread_count - nextCount
            return { ...item, unread_count: nextCount }
          })
          .filter((item) => item.unread_count > 0)
        return { ...activity, activity_email: nextEmail }
      })
      client.invalidateQueries({ queryKey: ['notification-activity', pid] })
      client.invalidateQueries({ queryKey: ['email-inbox', pid] })
      client.invalidateQueries({ queryKey: ['participant-executions', pid] })
    },
  })

  const runnerParticipantId = actorId || participantId
  const unreadCounts = Object.fromEntries(
    CHANNELS.map((channel) => [
      channel,
      channel === 'chat'
        ? activity.activity_chat.reduce((total, item) => total + item.unread_count, 0)
        : channel === 'email'
          ? activity.activity_email.reduce((total, item) => {
              const emailItem = item as { unread_count?: number }
              return total + (emailItem.unread_count ?? 0)
            }, 0)
          : 0,
    ]),
  ) as Record<Channel, number>

  const sendChat = (input: { simulationId: string; target: string; content: string }) => {
    if (!participantId.trim()) {
      toast.error('Choose an active simulation session.')
      return
    }
    chatAction.mutate({
      simulationId: input.simulationId,
      target: input.target,
      content: input.content,
    })
  }

  const sendEmail = (input: {
    simulationId: string
    target: string
    subject: string
    content: string
    parentEmailId?: string
    replyToEmailId?: string
    attachments?: ParticipantEmailAttachmentInput[]
  }) => {
    if (!participantId.trim()) {
      toast.error('Choose an active simulation session.')
      return
    }
    emailAction.mutate({
      simulationId: input.simulationId,
      target: input.target,
      subject: input.subject,
      content: input.content,
      parentEmailId: input.parentEmailId,
      replyToEmailId: input.replyToEmailId,
      attachments: input.attachments,
    })
  }

  const refresh = () => {
    client.invalidateQueries({ queryKey: ['notification-activity', participantId.trim()] })
    client.invalidateQueries({ queryKey: ['participant-executions', participantId.trim()] })
    client.invalidateQueries({ queryKey: ['chat-simulations'] })
    client.invalidateQueries({ queryKey: ['chat-actors'] })
    client.invalidateQueries({ queryKey: ['chat-messages'] })
    client.invalidateQueries({ queryKey: ['email-inbox'] })
    client.invalidateQueries({ queryKey: ['email-messages'] })
    client.invalidateQueries({ queryKey: ['email-thread-messages'] })
  }

  return (
    <SimulationRunContext.Provider
      value={{
        participantId,
        unreadCounts,
        runnerParticipantId,
        isChatPending: chatAction.isPending,
        sendChat,
        markChatRead: (simulationId, actorId) => messageRead.mutateAsync({ simulationId, actorId }),
        isEmailPending: emailAction.isPending,
        sendEmail,
        markEmailThreadRead: (simulationId, rootId) =>
          emailRead.mutateAsync({ simulationId, rootId }),
        refresh,
      }}
    >
      {children}
    </SimulationRunContext.Provider>
  )
}
