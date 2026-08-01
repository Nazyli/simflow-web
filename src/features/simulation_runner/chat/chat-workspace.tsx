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
  onConversationOpen?: (messages: ChatMessage[]) => void
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
  onConversationOpen,
  onSubmit,
}: ChatLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <ConversationSidebar conversations={conversations} selectedActor={selectedActor} onSelect={(actor) => {
        onSelectConversation(actor)
        onConversationOpen?.(conversations.find((conversation) => conversation.actor === actor)?.messages ?? [])
      }} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {activeConversation ? (
          <>
            <ConversationHeader conversation={activeConversation} />
            <ConversationBody messages={activeConversation.messages} participantId={participantId} quotedMessage={quotedMessage} onQuote={onQuote ?? undefined} />
            <MessageComposer target={activeConversation.actor} disabled={disabled} quoteRequired={quoteRequired} quotedMessage={quotedMessage} onClearQuote={onQuote ? () => onQuote(null) : undefined} onSubmit={onSubmit} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-slate-50/70 px-6 text-center">
            <div>
              <p className="text-sm font-semibold text-slate-700">Select a conversation</p>
              <p className="mt-1 text-xs text-slate-500">Choose a conversation from the list to open its messages and mark the latest workflow message as read.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ChatWorkspace({ participantId, events, actors, disabled, onSubmit, readMessageId, onMessageRead, quotedMessage, quoteRequired, onQuote, onConversationOpen }: ChannelWorkspaceProps & { readMessageId?: string; onMessageRead?: (messageId: string) => void; quotedMessage?: ChatMessage | null; quoteRequired?: boolean; onQuote?: (message: ChatMessage | null) => void; onConversationOpen?: (messages: ChatMessage[]) => void }) {
  const messages = events as unknown as ChatMessage[]
  const [selectedActor, setSelectedActor] = useState<string | null>(null)
  const conversations = buildConversations(messages, buildActorNames(actors), participantId)
  const activeConversation = selectedActor
    ? conversations.find((conversation) => conversation.actor === selectedActor) ?? null
    : null
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
        onConversationOpen={onConversationOpen}
        onSubmit={onSubmit}
      />
    </section>
  )
}
