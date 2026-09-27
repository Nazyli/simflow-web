import assert from 'node:assert/strict'
import test from 'node:test'

import { createEmptyDocumentDraft } from '../src/features/simulation_runner/document/document-editor-logic.ts'
import {
  canSaveDocumentEditor,
  editorSaveStatus,
  updateEditorName,
} from '../src/features/simulation_runner/document/document-editor-ui-logic.ts'

test('changing the document name produces a new draft without mutating the source', () => {
  const draft = createEmptyDocumentDraft()
  const changed = updateEditorName(draft, 'Guide')

  assert.equal(draft.documentName, '')
  assert.equal(changed.documentName, 'Guide')
  assert.notEqual(changed, draft)
})

test('save is disabled while saving or when the document name is blank', () => {
  const draft = createEmptyDocumentDraft()

  assert.equal(canSaveDocumentEditor(draft, false), false)
  assert.equal(canSaveDocumentEditor(updateEditorName(draft, 'Guide'), false), true)
  assert.equal(canSaveDocumentEditor(updateEditorName(draft, 'Guide'), true), false)
})

test('save status exposes text for saving, errors, dirty drafts, and saved drafts', () => {
  assert.equal(editorSaveStatus({ isSaving: true, isDirty: true, error: null }), 'Saving…')
  assert.equal(editorSaveStatus({ isSaving: false, isDirty: true, error: 'Failed' }), 'Failed')
  assert.equal(editorSaveStatus({ isSaving: false, isDirty: true, error: null }), 'Unsaved changes')
  assert.equal(editorSaveStatus({ isSaving: false, isDirty: false, error: null }), 'Saved')
})
