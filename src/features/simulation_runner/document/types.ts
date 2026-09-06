import type { RuntimeSimulationDocument } from '../../../shared/api/documents'

/**
 * Document channel local model.
 * Mirrors the runtime payload from `/runner/documents`; the mapper below
 * converts the API record into this view model 1:1.
 */

export type DocumentType = 'document'

export interface SimulationDocument {
  id: string
  title: string
  type: DocumentType
  status: 'unread' | 'read'
  simulationName: string | null
  sharedBy: string
  sharedAt: string
  pageCount: number
  openCount: number
  openedAt: string | null
  summary: string
  content: string
  pages: string[]
}

/** Visual metadata derived from document type. */
export interface DocumentTypeMeta {
  label: string
  color: string
  bg: string
}

export const DOCUMENT_TYPE_META: Record<DocumentType, DocumentTypeMeta> = {
  document: { label: 'Document', color: '#5b46c5', bg: '#ede9fe' },
}

export const DOCUMENT_STATUS_META: Record<
  SimulationDocument['status'],
  { label: string; className: string }
> = {
  unread: { label: 'Unread', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  read: { label: 'Read', className: 'bg-sky-50 text-sky-700 border-sky-200' },
}

const SUMMARY_MAX_LENGTH = 160

/** Convert a runtime document record from `/runner/documents` into the view model. */
export function mapRuntimeDocument(record: RuntimeSimulationDocument): SimulationDocument {
  const pageTexts = record.contents
    .map((page) => page.content ?? '')
    .filter((text) => text.length > 0)
  const content = pageTexts.join('\n\n')
  return {
    id: record.participant_doc_id,
    title: record.document_name ?? 'Untitled document',
    type: 'document',
    status: record.is_read ? 'read' : 'unread',
    simulationName: null,
    sharedBy: record.owner ?? '',
    sharedAt: record.created_date,
    pageCount: record.contents.length,
    openCount: record.counter,
    openedAt: record.opened_at,
    summary:
      content.length > SUMMARY_MAX_LENGTH ? `${content.slice(0, SUMMARY_MAX_LENGTH)}…` : content,
    content,
    pages: pageTexts.length > 0 ? pageTexts : [''],
  }
}

/** Format a relative-ish date for the sidebar. */
export function formatDocumentDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const isThisYear = d.getFullYear() === now.getFullYear()
  if (isThisYear) return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}
