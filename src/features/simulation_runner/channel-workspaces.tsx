import { FileText, Mail, Phone, Send } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import type { SessionChannelEvent } from '../../shared/api/sessions'

export type Channel = 'chat' | 'email' | 'call' | 'document'

export interface ChannelWorkspaceProps {
  participantId: string
  events: SessionChannelEvent[]
  actors: Record<string, unknown>[]
  documents: Record<string, unknown>[]
  disabled: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

interface FeedChannel {
  icon: LucideIcon
  label: string
  feedNote: string
  composerLabel: string
  textareaLabel: string
  placeholder: string
  submitLabel: string
}

const EMAIL_FEED: FeedChannel = {
  icon: Mail,
  label: 'email',
  feedNote: 'Inbox item',
  composerLabel: 'Recipient',
  textareaLabel: 'Email body',
  placeholder: 'Write a reply…',
  submitLabel: 'Send email reply',
}

const CALL_FEED: FeedChannel = {
  icon: Phone,
  label: 'call',
  feedNote: 'Call event',
  composerLabel: 'Recipient',
  textareaLabel: 'Call note',
  placeholder: 'Enter your response…',
  submitLabel: 'Finish call',
}

const DOCUMENT_FEED: FeedChannel = {
  icon: FileText,
  label: 'document',
  feedNote: 'Read-only state',
  composerLabel: 'Document',
  textareaLabel: '',
  placeholder: '',
  submitLabel: 'Close document',
}

function formatTime(value: unknown) {
  return typeof value === 'string' ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
}

function eventTitle(event: SessionChannelEvent, channel: string) {
  return String(event.subject ?? event.document_name ?? event.call_id ?? event.chat_id ?? `${channel} activity`)
}

function EventFeed({ channel, events, participantId }: { channel: FeedChannel; events: SessionChannelEvent[]; participantId: string }) {
  if (!events.length) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50/70 px-4 py-10 text-center">
        <p className="text-xs text-slate-400">No {channel.label} activity yet.</p>
      </div>
    )
  }
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 px-4 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {events.map((item, index) => {
          const sender = String(item.actor ?? item.from ?? 'system')
          const isParticipant = sender === participantId
          return (
            <article key={index} className={`flex gap-2 ${isParticipant ? 'justify-end' : 'justify-start'}`}>
              {!isParticipant && (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                  {sender.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="max-w-[75%] min-w-0">
                <div className={`flex items-baseline gap-2 px-1 ${isParticipant ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[10px] font-semibold text-slate-500">{sender}</span>
                  <time className="text-[10px] text-slate-400">{formatTime(item.timestamp)}</time>
                </div>
                <div className={`mt-0.5 whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${isParticipant ? 'rounded-br-md bg-[#5b46c5] text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                  <strong className="block text-xs font-semibold">{eventTitle(item, channel.label)}</strong>
                  {Boolean(item.content ?? item.action_type) && <span className="block">{String(item.content ?? item.action_type)}</span>}
                  <em className="mt-0.5 block text-[10px] not-italic text-slate-400">{channel.feedNote}</em>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function ChannelComposer({ channel, actors, documents, disabled, onSubmit }: { channel: FeedChannel } & Pick<ChannelWorkspaceProps, 'actors' | 'documents' | 'disabled' | 'onSubmit'>) {
  const isDocument = channel.label === 'document'
  const targets = isDocument
    ? documents.map((item) => [String(item.document_id), String(item.document_name)] as const)
    : actors.map((item) => [String(item.actor_id), String(item.actor_name)] as const)
  return (
    <form className="border-t border-slate-200 bg-white p-3" onSubmit={onSubmit}>
      <label className="mb-2 block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">{channel.composerLabel}</span>
        <select name="target" required className="!m-0 w-full rounded-lg !border-slate-300 bg-white !px-3 !py-2 text-sm text-slate-900 !shadow-none focus:!border-[#5b46c5] focus:!ring-2 focus:!ring-violet-200 focus:outline-none">
          {targets.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
      {!isDocument && (
        <label className="mb-2 block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">{channel.textareaLabel}</span>
          <textarea name="content" required placeholder={channel.placeholder} className="min-h-[52px] w-full resize-y rounded-lg !m-0 !border-slate-300 bg-white !px-3 !py-2 text-sm text-slate-900 !shadow-none focus:!border-[#5b46c5] focus:!ring-2 focus:!ring-violet-200 focus:outline-none" />
        </label>
      )}
      {isDocument && (
        <label className="mb-2 flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" name="read-only" className="!m-0 h-4 w-4 accent-[#5b46c5]" /> Open as read-only
        </label>
      )}
      <button type="submit" disabled={disabled} className="!m-0 !inline-flex w-full items-center justify-center gap-1.5 rounded-lg !border-0 !bg-[#5b46c5] !px-3 !py-2 text-sm font-semibold !text-white shadow-sm transition hover:!bg-[#4b38ac] disabled:opacity-50">
        <Send size={15} /> {channel.submitLabel}
      </button>
    </form>
  )
}

function ChannelCardShell({ channel, events, children }: { channel: FeedChannel; events: SessionChannelEvent[]; children: ReactNode }) {
  return (
    <section className="flex h-[480px] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-start gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-[#5b46c5]"><channel.icon size={17} /></span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold capitalize text-slate-900">{channel.label}</h2>
          <small className="text-[11px] text-slate-500">{events.length} event{events.length === 1 ? '' : 's'}</small>
        </div>
      </header>
      {children}
    </section>
  )
}

export function EmailWorkspace({ participantId, events, actors, documents, disabled, onSubmit }: ChannelWorkspaceProps) {
  return (
    <ChannelCardShell channel={EMAIL_FEED} events={events}>
      <EventFeed channel={EMAIL_FEED} events={events} participantId={participantId} />
      <ChannelComposer channel={EMAIL_FEED} actors={actors} documents={documents} disabled={disabled} onSubmit={onSubmit} />
    </ChannelCardShell>
  )
}

export function CallWorkspace({ participantId, events, actors, documents, disabled, onSubmit }: ChannelWorkspaceProps) {
  return (
    <ChannelCardShell channel={CALL_FEED} events={events}>
      <EventFeed channel={CALL_FEED} events={events} participantId={participantId} />
      <ChannelComposer channel={CALL_FEED} actors={actors} documents={documents} disabled={disabled} onSubmit={onSubmit} />
    </ChannelCardShell>
  )
}

export function DocumentWorkspace({ participantId, events, actors, documents, disabled, onSubmit }: ChannelWorkspaceProps) {
  return (
    <ChannelCardShell channel={DOCUMENT_FEED} events={events}>
      <EventFeed channel={DOCUMENT_FEED} events={events} participantId={participantId} />
      <ChannelComposer channel={DOCUMENT_FEED} actors={actors} documents={documents} disabled={disabled} onSubmit={onSubmit} />
    </ChannelCardShell>
  )
}
