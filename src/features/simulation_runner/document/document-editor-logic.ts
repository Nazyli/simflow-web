import type { DocumentWriteInput, RuntimeSimulationDocument } from '../../../shared/api/documents'
import { sanitizeHtml } from '../../../shared/html'

export interface DocumentEditorPageDraft {
  page: number
  content: string
}

export interface DocumentEditorDraft {
  participantDocId: string | null
  documentName: string
  contents: DocumentEditorPageDraft[]
}

export function createEmptyDocumentDraft(): DocumentEditorDraft {
  return {
    participantDocId: null,
    documentName: '',
    contents: [{ page: 1, content: '' }],
  }
}

export function draftFromRuntimeDocument(record: RuntimeSimulationDocument): DocumentEditorDraft {
  const contents = [...record.contents]
    .filter((content) => content.page !== null)
    .sort((left, right) => (left.page ?? 0) - (right.page ?? 0))
    .map((content) => ({
      page: content.page ?? 1,
      content: normalizeEditorHtml(content.content ?? ''),
    }))

  return {
    participantDocId: record.participantDocId,
    documentName: record.documentName ?? '',
    contents: contents.length > 0 ? contents : [{ page: 1, content: '' }],
  }
}

export function updateDraftPage(
  draft: DocumentEditorDraft,
  page: number,
  content: string,
): DocumentEditorDraft {
  return {
    ...draft,
    contents: draft.contents.map((item) => (item.page === page ? { ...item, content } : item)),
  }
}

export function appendDocumentDraftPage(draft: DocumentEditorDraft): DocumentEditorDraft {
  const lastPage = draft.contents.at(-1)?.page ?? 0
  return {
    ...draft,
    contents: [...draft.contents, { page: lastPage + 1, content: '' }],
  }
}

export function normalizeEditorHtml(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || /^<(?:br|div><br\s*\/?>|p><br\s*\/?>)\s*\/?>(?:<\/div>|<\/p>)?$/i.test(trimmed)) {
    return ''
  }
  if (typeof DOMParser === 'undefined') return trimmed
  return sanitizeHtml(trimmed)
}

export function serializeDocumentDraft(draft: DocumentEditorDraft): DocumentWriteInput {
  return {
    documentName: draft.documentName.trim(),
    contents: draft.contents.map((page) => ({
      page: page.page,
      content: normalizeEditorHtml(page.content),
    })),
  }
}

export function isDocumentDraftDirty(
  draft: DocumentEditorDraft,
  savedDraft: DocumentEditorDraft,
): boolean {
  return JSON.stringify(serializeDocumentDraft(draft)) !== JSON.stringify(serializeDocumentDraft(savedDraft))
}
