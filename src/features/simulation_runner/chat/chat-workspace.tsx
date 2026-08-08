import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ConversationBody } from './conversation-body'
import { ConversationHeader } from './conversation-header'
import { ConversationSidebar } from './conversation-sidebar'
import { MessageComposer } from './message-composer'
import { WorkflowSidebar } from './workflow-sidebar'
import type { ChatMessage, ChatWorkflow } from './types'
import { buildActorNames, buildConversations } from './utils'

export interface ChatWorkspaceProps {
  participantId: string
  messages: ChatMessage[]
  actors: Record<string, unknown>[]
  workflows: ChatWorkflow[]
  selectedWorkflow: string | null
  onSelectWorkflow: (workflowVersionId: string) => void
  disabled: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onConversationOpen?: (messages: ChatMessage[]) => void
}

export function ChatWorkspace({ participantId, messages, actors, workflows, selectedWorkflow, onSelectWorkflow, disabled, onSubmit, onConversationOpen }: ChatWorkspaceProps) {
  const [selectedActor, setSelectedActor] = useState<string | null>(null)
  const conversations = buildConversations(messages, buildActorNames(actors), participantId)
  const activeConversation = selectedActor ? conversations.find((conversation) => conversation.actor === selectedActor) ?? null : null

  useEffect(() => {
    setSelectedActor(null)
  }, [selectedWorkflow])

  return (
    <section className="col-span-full flex h-[540px] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <WorkflowSidebar workflows={workflows} selectedWorkflow={selectedWorkflow} onSelect={onSelectWorkflow} />
        <ConversationSidebar
          conversations={conversations}
          selectedActor={activeConversation?.actor ?? null}
          onSelect={(actor) => {
            setSelectedActor(actor)
            onConversationOpen?.(conversations.find((conversation) => conversation.actor === actor)?.messages ?? [])
          }}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {activeConversation ? (
            <>
              <ConversationHeader conversation={activeConversation} />
              <ConversationBody messages={activeConversation.messages} participantId={participantId} />
              <MessageComposer target={activeConversation.actor} disabled={disabled} onSubmit={onSubmit} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-slate-50/70 px-6 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-700">{workflows.length ? 'Select a conversation' : 'Select a workflow'}</p>
                <p className="mt-1 text-xs text-slate-500">Choose a workflow, then a conversation to open its messages.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
