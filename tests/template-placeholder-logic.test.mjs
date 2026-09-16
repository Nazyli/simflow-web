import assert from 'node:assert/strict'
import test from 'node:test'

import {
  insertTemplatePlaceholder,
  placeholderRangeForDeletion,
  tokenizeTemplate,
} from '../src/features/simulation_studio/master-data/template-placeholder-logic.ts'

test('inserts a placeholder at the active cursor position', () => {
  assert.deepEqual(insertTemplatePlaceholder('Hello ', 'user_name', 6, 6), {
    value: 'Hello {user_name}',
    caret: 17,
  })
})

test('replaces the active selection and places the caret after the token', () => {
  assert.deepEqual(insertTemplatePlaceholder('Hello participant', 'actor_name', 6, 17), {
    value: 'Hello {actor_name}',
    caret: 18,
  })
})

test('appends when the textarea has no selection information', () => {
  assert.deepEqual(insertTemplatePlaceholder('Hello', 'history'), {
    value: 'Hello{history}',
    caret: 14,
  })
})

test('classifies known and unknown complete placeholder tokens', () => {
  assert.deepEqual(tokenizeTemplate('Hi {user_name}, {not_allowed} {}', ['user_name']), [
    { text: 'Hi ', kind: 'text' },
    { text: '{user_name}', kind: 'valid' },
    { text: ', ', kind: 'text' },
    { text: '{not_allowed}', kind: 'invalid' },
    { text: ' ', kind: 'text' },
    { text: '{}', kind: 'invalid' },
  ])
})

test('deletes the whole placeholder when backspace reaches its closing brace', () => {
  assert.deepEqual(placeholderRangeForDeletion('Hi {user_name}!', 14, 'Backspace'), {
    start: 3,
    end: 14,
  })
})

test('deletes the whole placeholder when delete reaches its opening brace', () => {
  assert.deepEqual(placeholderRangeForDeletion('Hi {user_name}!', 3, 'Delete'), {
    start: 3,
    end: 14,
  })
})
