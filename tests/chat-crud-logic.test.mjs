import assert from 'node:assert/strict'
import test from 'node:test'

import {
  chatDialogInitialForm,
  chatFormFromRecord,
  chatNamePreview,
  emptyChatForm,
  validateChatForm,
} from '../src/features/simulation_studio/master-data/chat-crud-logic.ts'
import { isChatCrudEditor } from '../src/features/simulation_studio/parameter-field-logic.ts'

test('selects chat CRUD from the explicit picker editor metadata', () => {
  assert.equal(isChatCrudEditor({ editor: 'chat_crud' }), true)
  assert.equal(isChatCrudEditor({ editor: 'table' }), false)
  assert.equal(isChatCrudEditor(undefined), false)
})

test('starts a new chat form empty', () => {
  assert.deepEqual(emptyChatForm(), { actorId: '', content: '' })
})

test('maps an existing master chat into the edit form', () => {
  assert.deepEqual(chatFormFromRecord({ actorId: 'actor-1', content: 'Hello', chatId: 'chat-1' }), {
    actorId: 'actor-1',
    content: 'Hello',
  })
})

test('opens the chat dialog directly with a new or existing form', () => {
  const existing = {
    chatId: 'chat-1',
    nodeId: 'node-1',
    chatName: 'Hello',
    actorId: 'actor-1',
    content: 'Hello participant',
  }

  assert.deepEqual(chatDialogInitialForm(undefined, [existing]), emptyChatForm())
  assert.deepEqual(chatDialogInitialForm('chat-1', [existing]), {
    actorId: 'actor-1',
    content: 'Hello participant',
  })
})

test('validates actor and content before saving', () => {
  assert.equal(validateChatForm({ actorId: '', content: 'Hello' }), 'Select an actor.')
  assert.equal(validateChatForm({ actorId: 'actor-1', content: '  ' }), 'Enter chat content.')
  assert.equal(validateChatForm({ actorId: 'actor-1', content: 'Hello' }), null)
})

test('builds a readable chat name preview from content', () => {
  assert.equal(chatNamePreview('  Hello participant  '), 'Hello participant')
  assert.equal(chatNamePreview(''), 'Untitled chat')
  assert.equal(chatNamePreview('a'.repeat(260)).length, 255)
})
