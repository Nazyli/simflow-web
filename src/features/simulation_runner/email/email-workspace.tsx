import type { FormEvent } from 'react'
import { ConversationBody } from './conversation-body'
import { ConversationHeader } from './conversation-header'
import { ConversationSidebar } from './conversation-sidebar'
import { MessageComposer } from './message-composer'
import { WorkflowSidebar } from './workflow-sidebar'
import type { EmailInboxThread, EmailMessage, EmailWorkflow } from './types'

export interface EmailWorkspaceProps {
  participantId: string
  messages: EmailMessage[]
  threads: EmailInboxThread[]
  workflows: EmailWorkflow[]
  selectedWorkflow: string | null
  onSelectWorkflow: (workflowVersionId: string) => void
  selectedRootId: string | null
  onSelectThread: (rootId: string) => void
  selectedThread: EmailInboxThread | null
  disabled: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onConversationOpen?: (rootId: string) => void
}

export function EmailWorkspace({
  participantId,
  messages,
  threads,
  workflows,
  selectedWorkflow,
  onSelectWorkflow,
  selectedRootId,
  onSelectThread,
  selectedThread,
  disabled,
  onSubmit,
  onConversationOpen,
}: EmailWorkspaceProps) {
  return (
    <section className="col-span-full flex h-[540px] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <WorkflowSidebar
          workflows={workflows}
          selectedWorkflow={selectedWorkflow}
          onSelect={onSelectWorkflow}
        />
        <ConversationSidebar
          threads={threads}
          selectedRootId={selectedRootId}
          onSelect={(rootId) => {
            onSelectThread(rootId)
            onConversationOpen?.(rootId)
          }}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {selectedThread ? (
            <>
              <ConversationHeader thread={selectedThread} messages={messages} />
              <ConversationBody
                messages={messages}
                participantId={participantId}
              />
              <MessageComposer
                target={selectedThread.latestSenderId}
                disabled={disabled}
                onSubmit={onSubmit}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-slate-50/70 px-6 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {threads.length ? 'Select a conversation' : 'Select a workflow'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Choose a workflow, then an email thread to open it.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
