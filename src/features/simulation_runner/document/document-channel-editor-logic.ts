import type { RuntimeSimulationDocument } from '../../../shared/api/documents'
import {
  createEmptyDocumentDraft,
  draftFromRuntimeDocument,
  type DocumentEditorDraft,
} from './document-editor-logic'

export type DocumentEditorMode = 'read' | 'create' | 'edit'

export interface DocumentEditorSessionState {
  mode: DocumentEditorMode
  selectedId: string | null
  draft: DocumentEditorDraft | null
  savedDraft: DocumentEditorDraft | null
  error: string | null
}

export function createInitialDocumentEditorState(): DocumentEditorSessionState {
  return {
    mode: 'read',
    selectedId: null,
    draft: null,
    savedDraft: null,
    error: null,
  }
}

export function beginCreateDocument(
  _state: DocumentEditorSessionState,
): DocumentEditorSessionState {
  const draft = createEmptyDocumentDraft()
  return {
    mode: 'create',
    selectedId: null,
    draft,
    savedDraft: draft,
    error: null,
  }
}

export function beginEditDocument(
  _state: DocumentEditorSessionState,
  record: RuntimeSimulationDocument,
): DocumentEditorSessionState {
  const draft = draftFromRuntimeDocument(record)
  return {
    mode: 'edit',
    selectedId: record.participantDocId,
    draft,
    savedDraft: draft,
    error: null,
  }
}

export function finishDocumentSave(
  _state: DocumentEditorSessionState,
  record: RuntimeSimulationDocument,
): DocumentEditorSessionState {
  return {
    mode: 'read',
    selectedId: record.participantDocId,
    draft: null,
    savedDraft: null,
    error: null,
  }
}

export function recordDocumentSaveFailure(
  state: DocumentEditorSessionState,
  error: string,
): DocumentEditorSessionState {
  return { ...state, error }
}
