import { useEffect, useRef } from 'react'
import type { EmailMessage } from './types'
import { MessageBubble } from './message-bubble'

interface ConversationBodyProps {
  messages: EmailMessage[]
  participantId: string
}

export function ConversationBody({ messages, participantId }: ConversationBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#f6f8fb]">
        <div className="mx-auto max-w-3xl flex items-center justify-center px-4 py-10">
          <span className="text-xs text-[#5f6368]">No emails in this conversation yet.</span>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-[#f6f8fb]">
      <div className="mx-auto max-w-3xl">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.message_id || message.email_id || `msg-${index}`}
            message={message}
            participantId={participantId}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
