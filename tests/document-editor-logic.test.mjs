import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createEmptyDocumentDraft,
  draftFromRuntimeDocument,
  isDocumentDraftDirty,
  normalizeEditorHtml,
  serializeDocumentDraft,
  updateDraftPage,
} from '../src/features/simulation_runner/document/document-editor-logic.ts'

test('creates a new document draft with one empty page', () => {
  assert.deepEqual(createEmptyDocumentDraft(), {
    participantDocId: null,
    documentName: '',
    contents: [{ page: 1, content: '' }],
  })
})

test('maps runtime content rows into separate ordered editor pages', () => {
  const draft = draftFromRuntimeDocument({
    participantDocId: 'document-1',
    documentName: 'Guide',
    contents: [
      { participantDocContentId: 'page-2', page: 2, content: '<p>Two</p>' },
      { participantDocContentId: 'page-1', page: 1, content: '<p>One</p>' },
    ],
  })

  assert.deepEqual(draft, {
    participantDocId: 'document-1',
    documentName: 'Guide',
    contents: [
      { page: 1, content: '<p>One</p>' },
      { page: 2, content: '<p>Two</p>' },
    ],
  })
})

test('serializes pages in their existing order and reports dirty changes', () => {
  const draft = createEmptyDocumentDraft()
  const changed = updateDraftPage(draft, 1, '<p>Changed</p>')
  const named = { ...changed, documentName: 'Guide' }

  assert.equal(isDocumentDraftDirty(named, draft), true)
  assert.deepEqual(serializeDocumentDraft(named), {
    documentName: 'Guide',
    contents: [{ page: 1, content: '<p>Changed</p>' }],
  })
})

test('normalizes empty content and leaves meaningful HTML intact in the node test runtime', () => {
  assert.equal(normalizeEditorHtml(''), '')
  assert.equal(normalizeEditorHtml('  '), '')
  assert.equal(normalizeEditorHtml('<p>Meaningful</p>'), '<p>Meaningful</p>')
})
