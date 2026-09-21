import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DOCUMENTATION_ENTRIES,
  DOCUMENTATION_SECTIONS,
  filterDocumentationEntries,
  getDocumentationEntry,
  getDocumentationUrl,
  highlightSearchText,
  searchDocumentationEntries,
} from '../src/features/documentation/documentation-data.ts'
import { renderMarkdown } from '../src/features/documentation/markdown.ts'

test('keeps every public documentation file in the navigation manifest', () => {
  assert.equal(DOCUMENTATION_ENTRIES.length, 27)
  assert.equal(DOCUMENTATION_ENTRIES[0].file, '00-index.md')
  assert.equal(DOCUMENTATION_ENTRIES.at(-1).file, '34-ringkasan-coverage.md')
  assert.equal(new Set(DOCUMENTATION_ENTRIES.map((entry) => entry.slug)).size, 27)
})

test('groups documentation into readable navigation sections', () => {
  assert.deepEqual(
    DOCUMENTATION_SECTIONS.map((section) => section.label),
    ['Getting Started', 'Nodes', 'References'],
  )
  assert.equal(DOCUMENTATION_SECTIONS[0].entries[0].slug, '00-index')
  assert.equal(DOCUMENTATION_SECTIONS[1].entries.at(-1).slug, '21-end')
  assert.equal(DOCUMENTATION_SECTIONS[2].entries.length, 5)
})

test('resolves a documentation slug to its public Markdown URL', () => {
  const entry = getDocumentationEntry('08-wait-for-reply')

  assert.equal(entry?.title, 'Wait for Reply')
  assert.equal(getDocumentationUrl(entry), '/documentation/08-wait-for-reply.md')
  assert.equal(getDocumentationEntry('does-not-exist'), undefined)
})

test('filters navigation entries case-insensitively without changing their order', () => {
  assert.deepEqual(
    filterDocumentationEntries(DOCUMENTATION_ENTRIES, 'call').map((entry) => entry.title),
    [
      'Invite to Call',
      'Start Call',
      'Send Call Speech',
      'Wait for Call Utterance',
      'Wait for Call End',
      'End Call',
    ],
  )
  assert.equal(filterDocumentationEntries(DOCUMENTATION_ENTRIES, '  ').length, 27)
  assert.deepEqual(filterDocumentationEntries(DOCUMENTATION_ENTRIES, 'missing'), [])
})

test('searches Markdown content and returns a readable matching snippet', () => {
  const results = searchDocumentationEntries(
    [{ slug: 'wait', file: 'wait.md', title: 'Wait for Reply', section: 'nodes' }],
    'correlation',
    { wait: 'Reply wajib dikorelasikan menggunakan session dan correlation fields.' },
  )

  assert.equal(results[0].match, 'content')
  assert.match(results[0].snippet, /correlation fields/)
})

test('splits matching text into highlighted and plain parts', () => {
  assert.deepEqual(highlightSearchText('Wait for Reply', 'reply'), [
    { text: 'Wait for ', highlighted: false },
    { text: 'Reply', highlighted: true },
  ])
})

test('renders the Markdown structures used by the documentation files', () => {
  const html = renderMarkdown(
    '# Guide\n\nUse **bold** and `code`.\n\n| Name | Value |\n|---|---|\n| A | 1 |\n\n~~~mermaid\nflowchart LR\nA --> B\n~~~',
  )

  assert.match(html, /<h1[^>]*>Guide<\/h1>/)
  assert.match(html, /<strong>bold<\/strong>/)
  assert.match(html, /<code>code<\/code>/)
  assert.match(html, /<table>[\s\S]*<th>Name<\/th>[\s\S]*<td>A<\/td>/)
  assert.match(html, /<div class="mermaid-diagram" data-mermaid>flowchart LR\nA --&gt; B<\/div>/)
})

test('keeps underscores inside prompt placeholders when rendering Markdown', () => {
  const html = renderMarkdown('Selamat siang {user_titles} {user_name}')

  assert.match(html, /\{user_titles\} \{user_name\}/)
  assert.doesNotMatch(html, /<em>/)
})

test('recognizes a flowchart even when the code fence has the wrong language', () => {
  const html = renderMarkdown('```less\nflowchart LR\nA --> B\n```')

  assert.match(html, /<div class="mermaid-diagram" data-mermaid>flowchart LR\nA --&gt; B<\/div>/)
  assert.doesNotMatch(html, /language-less/)
})
