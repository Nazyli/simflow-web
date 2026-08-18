import type { FormEvent } from 'react'
import { Inbox } from 'lucide-react'
import { ConversationBody } from './conversation-body'
import { ConversationHeader } from './conversation-header'
import { ConversationSidebar } from './conversation-sidebar'
import { MessageComposer } from './message-composer'
import type { EmailInboxThread, EmailMessage } from './types'

export interface EmailWorkspaceProps {
  participantId: string
  messages: EmailMessage[]
  threads: EmailInboxThread[]
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
  selectedRootId,
  onSelectThread,
  selectedThread,
  disabled,
  onSubmit,
  onConversationOpen,
}: EmailWorkspaceProps) {
  return (
    <section className="col-span-full flex min-h-[540px] flex-1 min-h-0 flex-col overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
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
            <div className="flex flex-1 items-center justify-center bg-[#f6f8fb] px-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f1f3f4]">
                  <Inbox size={20} className="text-[#9aa0a6]" />
                </span>
                <div>
                  <p className="text-sm font-medium text-[#1a1a2e]">
                    {threads.length ? 'Select a conversation' : 'No emails yet'}
                  </p>
                  <p className="mt-1 text-xs text-[#5f6368]">
                    {threads.length
                      ? 'Choose an email thread from the list to read and reply.'
                      : 'Email messages from workflow actors will appear here.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
