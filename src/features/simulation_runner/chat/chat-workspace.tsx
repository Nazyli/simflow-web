import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { ChannelWorkspaceProps } from '../channel-workspaces'
import { ConversationBody } from './conversation-body'
import { ConversationHeader } from './conversation-header'
import { ConversationSidebar } from './conversation-sidebar'
import { MessageComposer } from './message-composer'
import type { ChatConversation, ChatMessage } from './types'
import { buildActorNames, buildConversations, messageKey } from './utils'

interface ChatLayoutProps {
  conversations: ChatConversation[]
  selectedActor: string | null
  onSelectConversation: (actor: string) => void
  activeConversation: ChatConversation | null
  participantId: string
  disabled: boolean
  quoteRequired?: boolean
  quotedMessage?: ChatMessage | null
  onQuote?: (message: ChatMessage | null) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ChatLayout({
  conversations,
  selectedActor,
  onSelectConversation,
  activeConversation,
  participantId,
  disabled,
  quoteRequired,
  quotedMessage,
  onQuote,
  onSubmit,
}: ChatLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <ConversationSidebar conversations={conversations} selectedActor={selectedActor} onSelect={onSelectConversation} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ConversationHeader conversation={activeConversation} />
        <ConversationBody messages={activeConversation?.messages ?? []} participantId={participantId} quotedMessage={quotedMessage} onQuote={onQuote ?? undefined} />
        <MessageComposer target={activeConversation?.actor ?? ''} disabled={disabled} quoteRequired={quoteRequired} quotedMessage={quotedMessage} onClearQuote={onQuote ? () => onQuote(null) : undefined} onSubmit={onSubmit} />
      </div>
    </div>
  )
}

export function ChatWorkspace({ participantId, events, actors, disabled, onSubmit, readMessageId, onMessageRead, quotedMessage, quoteRequired, onQuote }: ChannelWorkspaceProps & { readMessageId?: string; onMessageRead?: (messageId: string) => void; quotedMessage?: ChatMessage | null; quoteRequired?: boolean; onQuote?: (message: ChatMessage | null) => void }) {
  const messages = events as unknown as ChatMessage[]
  const [selectedActor, setSelectedActor] = useState<string | null>(null)
  const conversations = buildConversations(messages, buildActorNames(actors), participantId)
  const activeConversation = selectedActor
    ? conversations.find((conversation) => conversation.actor === selectedActor) ?? conversations[0] ?? null
    : conversations[0] ?? null
  const reportedReads = useRef(new Set<string>())

  useEffect(() => {
    if (quotedMessage && !messages.some((message) => messageKey(message) === messageKey(quotedMessage))) {
      onQuote?.(null)
    }
  }, [messages, onQuote, quotedMessage])

  useEffect(() => {
    if (!readMessageId || !onMessageRead || reportedReads.current.has(readMessageId)) return
    if (activeConversation?.messages.some((message) => message.message_id === readMessageId)) {
      reportedReads.current.add(readMessageId)
      onMessageRead(readMessageId)
    }
  }, [activeConversation, onMessageRead, readMessageId])

  return (
    <section className="col-span-full flex h-[540px] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <ChatLayout
        conversations={conversations}
        selectedActor={activeConversation?.actor ?? null}
        onSelectConversation={setSelectedActor}
        activeConversation={activeConversation}
        participantId={participantId}
        disabled={disabled}
        quoteRequired={quoteRequired}
        quotedMessage={quotedMessage}
        onQuote={onQuote}
        onSubmit={onSubmit}
      />
    </section>
  )
}
