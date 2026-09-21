import assert from 'node:assert/strict'
import test from 'node:test'

import { insertMarkdownSnippet } from '../src/features/simulation_studio/master-data/prompt-content-editor-logic.ts'

test('insertMarkdownSnippet wraps selected text and keeps the selected content active', () => {
  const result = insertMarkdownSnippet('Use this instruction', 4, 8, '**', '**', 'text')

  assert.equal(result.value, 'Use **this** instruction')
  assert.equal(result.selectionStart, 6)
  assert.equal(result.selectionEnd, 10)
})

test('insertMarkdownSnippet inserts fallback text and selects it when nothing is selected', () => {
  const result = insertMarkdownSnippet('Prompt', 6, 6, '```\n', '\n```', 'code')

  assert.equal(result.value, 'Prompt```\ncode\n```')
  assert.equal(result.selectionStart, 10)
  assert.equal(result.selectionEnd, 14)
})
