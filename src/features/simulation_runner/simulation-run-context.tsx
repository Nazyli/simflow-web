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
import {
  markEmailAsRead,
  sendParticipantEmail,
  type EmailActorItem,
  type EmailMarkAsReadResult,
  type EmailMessage,
  type EmailWorkflowItem,
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
  sendChat: (input: { workflowVersionId: string; target: string; content: string }) => void
  markChatRead: (workflowVersionId: string, actorId: string) => Promise<ChatMarkAsReadResult>
  isEmailPending: boolean
  sendEmail: (input: {
    workflowVersionId: string
    target: string
    subject: string
    content: string
  }) => void
  markEmailRead: (workflowVersionId: string, partnerId: string) => Promise<EmailMarkAsReadResult>
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
  })
  const activity = activityQuery.data ?? { activity_chat: [], activity_email: [] }

  useEffect(() => {
    const streamParticipantId = participantId.trim()
    if (!streamParticipantId) return
    const events = new EventSource(eventsUrl(streamParticipantId))
    const refreshRunner = (event: Event) => {
      void client.invalidateQueries({ queryKey: ['notification-activity', streamParticipantId] })
      void client.invalidateQueries({ queryKey: ['participant-executions', streamParticipantId] })
      void client.invalidateQueries({ queryKey: ['chat-workflows'] })
      void client.invalidateQueries({ queryKey: ['chat-actors'] })
      void client.invalidateQueries({ queryKey: ['chat-messages'] })
      void client.invalidateQueries({ queryKey: ['email-workflows'] })
      void client.invalidateQueries({ queryKey: ['email-actors'] })
      void client.invalidateQueries({ queryKey: ['email-messages'] })
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
    events.addEventListener('notification', refreshRunner)
    return () => events.close()
  }, [client, participantId])

  const chatAction = useMutation({
    mutationFn: ({
      workflowVersionId,
      target,
      content,
    }: {
      workflowVersionId: string
      target: string
      content: string
    }) => sendParticipantChat(participantId.trim(), target, content, workflowVersionId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['chat-messages'] })
      client.invalidateQueries({ queryKey: ['chat-workflows'] })
      client.invalidateQueries({ queryKey: ['chat-actors'] })
      client.invalidateQueries({ queryKey: ['participant-executions', participantId.trim()] })
      client.invalidateQueries({ queryKey: ['notification-activity', participantId.trim()] })
    },
    onError: () => toast.error('Reply was rejected. Check the requested actor and workflow.'),
  })

  const messageRead = useMutation({
    mutationFn: ({ workflowVersionId, actorId }: { workflowVersionId: string; actorId: string }) =>
      markChatMessageRead(participantId.trim(), workflowVersionId, actorId),
    onSuccess: ({ count }, { workflowVersionId, actorId }) => {
      const pid = participantId.trim()
      client.setQueryData<ChatMessage[]>(
        ['chat-messages', pid, workflowVersionId, actorId],
        (messages) =>
          messages?.map((message) =>
            message.sender_type === 'actor' && !message.is_read
              ? { ...message, is_read: true, read_at: message.read_at ?? new Date().toISOString() }
              : message,
          ),
      )
      client.setQueryData<ChatActorItem[]>(['chat-actors', pid, workflowVersionId], (actors) =>
        actors?.map((actor) =>
          actor.actor_id === actorId
            ? { ...actor, unread_count: Math.max(0, actor.unread_count - count) }
            : actor,
        ),
      )
      client.setQueryData<ChatWorkflowItem[]>(['chat-workflows', pid], (workflows) =>
        workflows?.map((workflow) =>
          workflow.workflow_version_id === workflowVersionId
            ? { ...workflow, unread_count: Math.max(0, workflow.unread_count - count) }
            : workflow,
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
      client.invalidateQueries({ queryKey: ['participant-executions', pid] })
    },
  })

  const emailAction = useMutation({
    mutationFn: ({
      workflowVersionId,
      target,
      subject,
      content,
    }: {
      workflowVersionId: string
      target: string
      subject: string
      content: string
    }) =>
      sendParticipantEmail(
        participantId.trim(),
        target,
        subject,
        content,
        workflowVersionId,
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['email-messages'] })
      client.invalidateQueries({ queryKey: ['email-workflows'] })
      client.invalidateQueries({ queryKey: ['email-actors'] })
      client.invalidateQueries({ queryKey: ['participant-executions', participantId.trim()] })
      client.invalidateQueries({ queryKey: ['notification-activity', participantId.trim()] })
    },
    onError: () => toast.error('Email was rejected. Check the requested contact and workflow.'),
  })

  const emailRead = useMutation({
    mutationFn: ({
      workflowVersionId,
      partnerId,
    }: {
      workflowVersionId: string
      partnerId: string
    }) => markEmailAsRead(participantId.trim(), workflowVersionId, partnerId),
    onSuccess: ({ count }, { workflowVersionId, partnerId }) => {
      const pid = participantId.trim()
      client.setQueryData<EmailMessage[]>(
        ['email-messages', pid, workflowVersionId, partnerId],
        (messages) =>
          messages?.map((message) =>
            message.sender_type === 'actor' && !message.is_read
              ? { ...message, is_read: true, read_at: message.read_at ?? new Date().toISOString() }
              : message,
          ),
      )
      client.setQueryData<EmailActorItem[]>(['email-actors', pid, workflowVersionId], (actors) =>
        actors?.map((actor) =>
          actor.actor_id === partnerId
            ? { ...actor, unread_count: Math.max(0, actor.unread_count - count) }
            : actor,
        ),
      )
      client.setQueryData<EmailWorkflowItem[]>(['email-workflows', pid], (workflows) =>
        workflows?.map((workflow) =>
          workflow.workflow_version_id === workflowVersionId
            ? { ...workflow, unread_count: Math.max(0, workflow.unread_count - count) }
            : workflow,
        ),
      )
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

  const sendChat = (input: { workflowVersionId: string; target: string; content: string }) => {
    if (!participantId.trim()) {
      toast.error('Choose an active simulation session.')
      return
    }
    chatAction.mutate({
      workflowVersionId: input.workflowVersionId,
      target: input.target,
      content: input.content,
    })
  }

  const sendEmail = (input: {
    workflowVersionId: string
    target: string
    subject: string
    content: string
  }) => {
    if (!participantId.trim()) {
      toast.error('Choose an active simulation session.')
      return
    }
    emailAction.mutate({
      workflowVersionId: input.workflowVersionId,
      target: input.target,
      subject: input.subject,
      content: input.content,
    })
  }

  const refresh = () => {
    client.invalidateQueries({ queryKey: ['notification-activity', participantId.trim()] })
    client.invalidateQueries({ queryKey: ['participant-executions', participantId.trim()] })
    client.invalidateQueries({ queryKey: ['chat-workflows'] })
    client.invalidateQueries({ queryKey: ['chat-actors'] })
    client.invalidateQueries({ queryKey: ['chat-messages'] })
    client.invalidateQueries({ queryKey: ['email-workflows'] })
    client.invalidateQueries({ queryKey: ['email-actors'] })
    client.invalidateQueries({ queryKey: ['email-messages'] })
  }

  return (
    <SimulationRunContext.Provider
      value={{
        participantId,
        unreadCounts,
        runnerParticipantId,
        isChatPending: chatAction.isPending,
        sendChat,
        markChatRead: (workflowVersionId, actorId) =>
          messageRead.mutateAsync({ workflowVersionId, actorId }),
        isEmailPending: emailAction.isPending,
        sendEmail,
        markEmailRead: (workflowVersionId, partnerId) =>
          emailRead.mutateAsync({ workflowVersionId, partnerId }),
        refresh,
      }}
    >
      {children}
    </SimulationRunContext.Provider>
  )
}
