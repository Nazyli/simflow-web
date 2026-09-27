import type { DocumentEditorDraft } from './document-editor-logic'

export function updateEditorName(draft: DocumentEditorDraft, documentName: string): DocumentEditorDraft {
  return { ...draft, documentName }
}

export function canSaveDocumentEditor(draft: DocumentEditorDraft, isSaving: boolean): boolean {
  return !isSaving && Boolean(draft.documentName.trim()) && draft.contents.length > 0
}

export function editorSaveStatus({
  isSaving,
  isDirty,
  error,
}: {
  isSaving: boolean
  isDirty: boolean
  error: string | null
}): string {
  if (isSaving) return 'Saving…'
  if (error) return error
  return isDirty ? 'Unsaved changes' : 'Saved'
}
