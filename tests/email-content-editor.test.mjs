import assert from 'node:assert/strict'
import test from 'node:test'

import { buildEmailPreviewDocument } from '../src/features/simulation_studio/master-data/email-content-editor-logic.ts'

test('buildEmailPreviewDocument keeps email markup inside a styled preview document', () => {
  const content = '<table><tr><td style="color: red">Hello</td></tr></table>'
  const document = buildEmailPreviewDocument(content)

  assert.match(document, /<!doctype html>/i)
  assert.match(document, /Email preview/i)
  assert.match(document, /max-width: 680px/)
  assert.match(document, /<table><tr><td style="color: red">Hello<\/td><\/tr><\/table>/)
})

test('buildEmailPreviewDocument renders empty content without an undefined value', () => {
  const document = buildEmailPreviewDocument('')

  assert.match(document, /<div class="email-preview-content"><\/div>/)
  assert.doesNotMatch(document, /undefined|null/)
})
