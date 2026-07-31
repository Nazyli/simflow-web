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
  if (!events.length) return <p className="empty-channel">No {channel.label} activity yet.</p>
  return (
    <div className="channel-feed">
      {events.map((item, index) => {
        const sender = String(item.actor ?? item.from ?? 'system')
        const isParticipant = sender === participantId
        return (
          <article className={isParticipant ? 'participant' : ''} key={index}>
            <span className="event-avatar">{sender.slice(0, 1).toUpperCase()}</span>
            <div>
              <small>{sender} · {formatTime(item.timestamp)}</small>
              <strong>{eventTitle(item, channel.label)}</strong>
              <p>{String(item.content ?? item.action_type ?? '')}</p>
              <em>{channel.feedNote}</em>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function ChannelComposer({ channel, actors, documents, disabled, onSubmit }: { channel: FeedChannel } & Pick<ChannelWorkspaceProps, 'actors' | 'documents' | 'disabled' | 'onSubmit'>) {
  const isDocument = channel.label === 'document'
  const targets = isDocument
    ? documents.map((item) => [String(item.document_id), String(item.document_name)] as const)
    : actors.map((item) => [String(item.actor_id), String(item.actor_name)] as const)
  return (
    <form className="action-composer" onSubmit={onSubmit}>
      <label>{channel.composerLabel}<select name="target" required>{targets.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      {!isDocument && <label>{channel.textareaLabel}<textarea name="content" required placeholder={channel.placeholder} /></label>}
      {isDocument && <label className="read-only"><input type="checkbox" name="read-only" /> Open as read-only</label>}
      <button disabled={disabled}><Send size={15} />{channel.submitLabel}</button>
    </form>
  )
}

function ChannelCardShell({ channel, events, children }: { channel: FeedChannel; events: SessionChannelEvent[]; children: ReactNode }) {
  return (
    <section className={`channel-card cockpit-card ${channel.label}`}>
      <header>
        <span className="channel-icon"><channel.icon size={17} /></span>
        <div>
          <h2>{channel.label}</h2>
          <small>{events.length} event{events.length === 1 ? '' : 's'}</small>
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
