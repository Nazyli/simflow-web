import { useEffect, useRef } from 'react'
import type { ChatMessage } from './types'
import { MessageBubble } from './message-bubble'
import { messageKey } from './utils'

interface ConversationBodyProps {
  messages: ChatMessage[]
  participantId: string
  quotedMessage?: ChatMessage | null
  onQuote?: (message: ChatMessage) => void
}

export function ConversationBody({ messages, participantId, quotedMessage, onQuote }: ConversationBodyProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50/70 px-4 py-10 text-center">
        <p className="text-xs text-slate-400">No messages in this conversation yet.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 px-4 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} participantId={participantId} quoted={Boolean(quotedMessage && messageKey(message) === messageKey(quotedMessage))} onQuote={onQuote} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
