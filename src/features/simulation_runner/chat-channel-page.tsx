import { useQueries, useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { getChatMessages } from '../../shared/api/chat'
import { getMasterData } from '../../shared/api/master-data'
import { ChatWorkspace } from './chat/chat-workspace'
import type { ChatMessage } from './chat/types'
import { useSimulationRun } from './simulation-run-context'

export function ChatChannelPage() {
  const { participantId, runnerParticipantId, activeExecution, runs, isChatPending, sendChat, markChatRead, deferredReadWait } = useSimulationRun()
  const [quotedMessage, setQuotedMessage] = useState<ChatMessage | null>(null)
  const actors = useQuery({ queryKey: ['master', 'actors'], queryFn: () => getMasterData('actors') })
  const chatQueries = useQueries({ queries: runs.filter((run) => run.session_id).map((run) => ({ queryKey: ['chat-messages', run.session_id], queryFn: () => getChatMessages(run.session_id!), enabled: Boolean(run.session_id) })) })
  const chatEvents = chatQueries.flatMap((query) => (query.data ?? []).map((message) => ({
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
  })))
  const events = chatEvents.map((event) => ({ ...event, is_unread: event.is_read === false }))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    sendChat({ target: String(data.get('target') ?? ''), content: String(data.get('content') ?? '') })
    event.currentTarget.reset()
  }

  return (
    <ChatWorkspace
      participantId={runnerParticipantId}
      events={events}
      actors={actors.data ?? []}
      documents={[]}
      disabled={isChatPending}
      onSubmit={submit}
      readMessageId={deferredReadWait?.messageId}
      onMessageRead={deferredReadWait && activeExecution?.session_id ? (messageId) => markChatRead(activeExecution.session_id!, messageId) : undefined}
      quotedMessage={quotedMessage}
      quoteRequired={false}
      onQuote={setQuotedMessage}
      onConversationOpen={(messages) => messages.forEach((message) => {
        if (message.message_id && message.session_id && message.from !== runnerParticipantId && message.is_unread) markChatRead(message.session_id, message.message_id)
      })}
    />
  )
}
