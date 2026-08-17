import { useEffect, useRef } from 'react'
import type { EmailMessage } from './types'
import { MessageBubble } from './message-bubble'

interface ConversationBodyProps {
  messages: EmailMessage[]
  participantId: string
}

export function ConversationBody({ messages, participantId }: ConversationBodyProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50/70 px-4 py-10 text-center">
        <p className="text-xs text-slate-400">No emails in this conversation yet.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 px-4 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} participantId={participantId} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
