import type { FormEvent } from 'react'
import { ConversationBody } from './conversation-body'
import { ConversationHeader } from './conversation-header'
import { ConversationSidebar } from './conversation-sidebar'
import { MessageComposer } from './message-composer'
import { WorkflowSidebar } from './workflow-sidebar'
import type { ChatActor, ChatMessage, ChatWorkflow } from './types'
import { buildConversations } from './utils'

export interface ChatWorkspaceProps {
  participantId: string
  messages: ChatMessage[]
  actors: ChatActor[]
  workflows: ChatWorkflow[]
  selectedWorkflow: string | null
  onSelectWorkflow: (workflowVersionId: string) => void
  selectedActor: string | null
  onSelectActor: (actorId: string) => void
  disabled: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onConversationOpen?: (actorId: string) => void
}

export function ChatWorkspace({
  participantId,
  messages,
  actors,
  workflows,
  selectedWorkflow,
  onSelectWorkflow,
  selectedActor,
  onSelectActor,
  disabled,
  onSubmit,
  onConversationOpen,
}: ChatWorkspaceProps) {
  const actorNames = Object.fromEntries(actors.map((actor) => [actor.actorId, actor.actorName]))
  const conversations = buildConversations(messages, actorNames, participantId)
  const activeConversation = selectedActor
    ? (conversations.find((conversation) => conversation.actor === selectedActor) ?? null)
    : null

  return (
    <section className="col-span-full flex min-h-[540px] flex-1 min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <WorkflowSidebar
          workflows={workflows}
          selectedWorkflow={selectedWorkflow}
          onSelect={onSelectWorkflow}
        />
        <ConversationSidebar
          actors={actors}
          selectedActor={selectedActor}
          onSelect={(actor) => {
            onSelectActor(actor)
            onConversationOpen?.(actor)
          }}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {activeConversation ? (
            <>
              <ConversationHeader conversation={activeConversation} />
              <ConversationBody
                messages={activeConversation.messages}
                participantId={participantId}
              />
              <MessageComposer
                target={activeConversation.actor}
                disabled={disabled}
                onSubmit={onSubmit}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-slate-50/70 px-6 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {actors.length ? 'Select a conversation' : 'Select a workflow'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Choose a workflow, then a conversation to open its messages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
