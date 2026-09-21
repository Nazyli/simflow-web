import assert from 'node:assert/strict'
import test from 'node:test'

import { renderPromptPreview } from '../src/features/simulation_studio/master-data/prompt-preview-logic.ts'

test('renders injected prompt content as Markdown HTML', () => {
  const html = renderPromptPreview('# Hasil\n\n**Pesan penting**\n\n- Satu\n- Dua')

  assert.match(html, /<h1>Hasil<\/h1>/)
  assert.match(html, /<strong>Pesan penting<\/strong>/)
  assert.match(html, /<ul><li>Satu<\/li><li>Dua<\/li><\/ul>/)
})
