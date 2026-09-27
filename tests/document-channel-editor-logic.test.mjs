import assert from 'node:assert/strict'
import test from 'node:test'

import {
  beginCreateDocument,
  beginEditDocument,
  createInitialDocumentEditorState,
  finishDocumentSave,
  recordDocumentSaveFailure,
} from '../src/features/simulation_runner/document/document-channel-editor-logic.ts'

const runtimeDocument = {
  participantDocId: 'participant-doc-1',
  participantId: 'participant-1',
  sessionId: 'session-1',
  executionId: null,
  participantFolderId: null,
  documentName: 'Policy',
  documentId: null,
  isHighlight: false,
  isRead: false,
  owner: 'participant-1',
  openedAt: null,
  counter: 0,
  createdBy: 'participant-1',
  createdDate: '2026-09-27T10:00:00Z',
  modifiedDate: null,
  contents: [
    {
      participantDocContentId: 'content-1',
      participantDocId: 'participant-doc-1',
      page: 1,
      content: '<p>Page one</p>',
      contentMd: null,
      isHighlight: false,
    },
  ],
}

test('starts create mode with one editable empty page', () => {
  const state = beginCreateDocument(createInitialDocumentEditorState())

  assert.equal(state.mode, 'create')
  assert.equal(state.selectedId, null)
  assert.equal(state.draft?.documentName, '')
  assert.deepEqual(state.draft?.contents, [{ page: 1, content: '' }])
})

test('starts edit mode from the selected runtime document', () => {
  const state = beginEditDocument(createInitialDocumentEditorState(), runtimeDocument)

  assert.equal(state.mode, 'edit')
  assert.equal(state.selectedId, 'participant-doc-1')
  assert.equal(state.draft?.documentName, 'Policy')
  assert.equal(state.savedDraft?.contents[0].content, '<p>Page one</p>')
})

test('save failure keeps the draft and exposes the error', () => {
  const editing = beginEditDocument(createInitialDocumentEditorState(), runtimeDocument)
  const failed = recordDocumentSaveFailure(editing, 'Save failed')

  assert.equal(failed.mode, 'edit')
  assert.equal(failed.draft, editing.draft)
  assert.equal(failed.savedDraft, editing.savedDraft)
  assert.equal(failed.error, 'Save failed')
})

test('successful save returns to read mode and selects the saved document', () => {
  const creating = beginCreateDocument(createInitialDocumentEditorState())
  const saved = finishDocumentSave(creating, runtimeDocument)

  assert.deepEqual(saved, {
    mode: 'read',
    selectedId: 'participant-doc-1',
    draft: null,
    savedDraft: null,
    error: null,
  })
})
