import assert from 'node:assert/strict'
import test from 'node:test'

import {
  callDialogInitialForm,
  emptyCallForm,
  validateCallForm,
} from '../src/features/simulation_studio/master-data/call-crud-logic.ts'
import {
  emptyPromptForm,
  promptDialogInitialForm,
  validatePromptForm,
} from '../src/features/simulation_studio/master-data/prompt-crud-logic.ts'
import { isCrudEditor } from '../src/features/simulation_studio/parameter-field-logic.ts'

test('routes call and prompt pickers to explicit CRUD editors', () => {
  assert.equal(isCrudEditor({ editor: 'chat_crud' }), true)
  assert.equal(isCrudEditor({ editor: 'call_crud' }), true)
  assert.equal(isCrudEditor({ editor: 'prompt_crud' }), true)
  assert.equal(isCrudEditor({ editor: 'table' }), false)
})

test('starts a new call form and validates actor plus content', () => {
  assert.deepEqual(emptyCallForm(), { actorId: '', content: '' })
  assert.equal(validateCallForm({ actorId: '', content: 'Hello' }), 'Select an actor.')
  assert.equal(validateCallForm({ actorId: 'actor-1', content: '  ' }), 'Enter call content.')
  assert.equal(validateCallForm({ actorId: 'actor-1', content: 'Hello' }), null)
})

test('maps an existing call into its edit form', () => {
  const records = [
    { callId: 'call-1', actorId: 'actor-1', content: 'Speak', callName: null, nodeId: 'node-1' },
  ]
  assert.deepEqual(callDialogInitialForm('call-1', records), {
    actorId: 'actor-1',
    content: 'Speak',
  })
})

test('starts a new prompt form and requires content', () => {
  assert.deepEqual(emptyPromptForm(), { content: '', desc: '' })
  assert.equal(validatePromptForm({ content: '  ', desc: '' }), 'Enter prompt content.')
  assert.equal(validatePromptForm({ content: 'Classify', desc: '' }), null)
})

test('maps an existing prompt into its edit form', () => {
  const records = [{ promptId: 'prompt-1', nodeId: 'node-1', content: 'Classify', desc: 'Intent' }]
  assert.deepEqual(promptDialogInitialForm('prompt-1', records), {
    content: 'Classify',
    desc: 'Intent',
  })
})
