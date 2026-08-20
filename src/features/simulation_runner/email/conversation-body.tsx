import { useEffect, useRef } from 'react'
import type { EmailAttachment, EmailMessage } from './types'
import { MessageBubble } from './message-bubble'

interface ConversationBodyProps {
  messages: EmailMessage[]
  participantId: string
  openingAttachmentIds: ReadonlySet<string>
  onOpenAttachment: (message: EmailMessage, attachment: EmailAttachment) => void
}

export function ConversationBody({
  messages,
  participantId,
  openingAttachmentIds,
  onOpenAttachment,
}: ConversationBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#f6f8fb]">
        <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-10">
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
            openingAttachmentIds={openingAttachmentIds}
            onOpenAttachment={onOpenAttachment}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
