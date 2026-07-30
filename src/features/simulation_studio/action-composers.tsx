import type { ChangeEvent, ReactNode } from 'react'

export type ActionPayload = Record<string, unknown>
export type ComposerProps = { operation: string; value: ActionPayload; onChange: (patch: ActionPayload) => void }
type Composer = (props: ComposerProps) => ReactNode

const requiredByOperation: Record<string, string[]> = {
  send_email: ['to', 'subject', 'content'], reply_email: ['email_id', 'content'], read_email: ['email_id'],
  send_chat: ['to', 'content'], reply_chat: ['chat_id', 'content'], read_chat: ['chat_id'], ignore_chat: ['chat_id'],
  start_call: ['call_id'], finish_call: ['call_id'], open_document: ['document_id'], close_document: ['document_id'],
}

function field(label: string, name: string, props: ComposerProps, multiline = false) {
  const update = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => props.onChange({ [name]: event.target.value })
  return <label key={name}>{label}{multiline ? <textarea value={String(props.value[name] ?? '')} onChange={update} /> : <input value={String(props.value[name] ?? '')} onChange={update} />}</label>
}

export function EmailComposer(props: ComposerProps) { return <>{props.operation === 'send_email' && <>{field('To', 'to', props)}{field('Subject', 'subject', props)}</>}{['reply_email', 'read_email'].includes(props.operation) && field('Email ID', 'email_id', props)}{props.operation !== 'read_email' && field('Content', 'content', props, true)}</> }
export function ChatComposer(props: ComposerProps) { return <>{props.operation === 'send_chat' ? field('To', 'to', props) : field('Chat ID', 'chat_id', props)}{props.operation !== 'read_chat' && props.operation !== 'ignore_chat' && field('Message', 'content', props, true)}</> }
export function CallComposer(props: ComposerProps) { return <>{field('Call ID', 'call_id', props)}{field('Metadata note', 'metadata_note', props, true)}</> }
export function DocumentComposer(props: ComposerProps) { return <>{field('Document ID', 'document_id', props)}{props.operation === 'open_document' && field('Document name', 'document_name', props)}</> }

const composers: Record<string, Composer> = { email: EmailComposer, chat: ChatComposer, call: CallComposer, document: DocumentComposer }
export function ActionComposer({ channel, ...props }: ComposerProps & { channel: string }) { const ComposerComponent = composers[channel]; return ComposerComponent ? <ComposerComponent {...props} /> : null }
export function validateActionPayload(operation: string, payload: ActionPayload): string[] { return (requiredByOperation[operation] ?? []).flatMap((fieldName) => typeof payload[fieldName] === 'string' && String(payload[fieldName]).trim() ? [] : [`${fieldName} is required for ${operation}.`]) }
