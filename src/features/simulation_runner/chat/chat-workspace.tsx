import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { ChannelWorkspaceProps } from '../channel-workspaces'
import { ConversationBody } from './conversation-body'
import { ConversationHeader } from './conversation-header'
import { ConversationSidebar } from './conversation-sidebar'
import { MessageComposer } from './message-composer'
import type { ChatConversation, ChatMessage } from './types'
import { buildActorNames, buildConversations } from './utils'

interface ChatLayoutProps {
  conversations: ChatConversation[]
  selectedActor: string | null
  onSelectConversation: (actor: string) => void
  activeConversation: ChatConversation | null
  participantId: string
  disabled: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ChatLayout({
  conversations,
  selectedActor,
  onSelectConversation,
  activeConversation,
  participantId,
  disabled,
  onSubmit,
}: ChatLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <ConversationSidebar conversations={conversations} selectedActor={selectedActor} onSelect={onSelectConversation} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ConversationHeader conversation={activeConversation} />
        <ConversationBody messages={activeConversation?.messages ?? []} participantId={participantId} />
        <MessageComposer target={activeConversation?.actor ?? ''} disabled={disabled} onSubmit={onSubmit} />
      </div>
    </div>
  )
}

export function ChatWorkspace({ participantId, events, actors, disabled, onSubmit, readMessageId, onMessageRead }: ChannelWorkspaceProps & { readMessageId?: string; onMessageRead?: (messageId: string) => void }) {
  const messages = events as unknown as ChatMessage[]
  const [selectedActor, setSelectedActor] = useState<string | null>(null)
  const conversations = buildConversations(messages, buildActorNames(actors), participantId)
  const activeConversation = selectedActor
    ? conversations.find((conversation) => conversation.actor === selectedActor) ?? conversations[0] ?? null
    : conversations[0] ?? null
  const reportedReads = useRef(new Set<string>())

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
        onSubmit={onSubmit}
      />
    </section>
  )
}
