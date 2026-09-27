import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import test from 'node:test'

globalThis.React = React

const { PageFrame } = await import('../src/components/layout/page-frame.tsx')
const { Button } = await import('../src/components/ui/button.tsx')
const { ErrorState } = await import('../src/shared/components/async-state.tsx')

test('PageFrame defaults to compact density and permits comfortable pages', () => {
  const compact = renderToStaticMarkup(createElement(PageFrame, null, 'content'))
  const comfortable = renderToStaticMarkup(
    createElement(PageFrame, { density: 'comfortable' }, 'content'),
  )

  assert.match(compact, /app-density-compact/)
  assert.doesNotMatch(comfortable, /app-density-compact/)
})

test('Documentation opts out of compact density', () => {
  const documentation = readFileSync(
    new URL('../src/features/documentation/documentation-page.tsx', import.meta.url),
    'utf8',
  )

  assert.ok(
    /<PageFrame mode="reference" density="comfortable" className=/.test(documentation),
    'Documentation should opt out of compact density',
  )
})

test('Simulation cards use compact height and preserve mobile action targets', () => {
  const simulationList = readFileSync(
    new URL('../src/features/simulation_studio/simulation-list-page.tsx', import.meta.url),
    'utf8',
  )

  assert.match(simulationList, /min-h-32 min-w-0 flex-col/)
  assert.equal(
    (simulationList.match(/max-\[640px\]:min-h-11 max-\[640px\]:min-w-11/g) ?? []).length,
    2,
    'Edit and delete controls should each keep a 44px mobile touch target',
  )
})

test('Compact pages reduce data-table cell padding at every viewport size', () => {
  const styles = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

  assert.match(
    styles,
    /\.app-density-compact \.app-data-table \[data-slot='table-cell'\]\s*\{\s*padding-block: 6px;/,
  )
})

test('Shared controls use compact readable defaults', () => {
  const button = renderToStaticMarkup(createElement(Button, null, 'Save'))
  const inputStyles = readFileSync(
    new URL('../src/shared/form-classes.ts', import.meta.url),
    'utf8',
  )

  assert.match(button, /text-xs/)
  assert.match(button, /h-8/)
  assert.match(inputStyles, /'h-8 w-full/)
})

test('ErrorState does not assume every error is a network failure', () => {
  const markup = renderToStaticMarkup(
    createElement(ErrorState, { message: 'Unable to load actors.' }),
  )

  assert.match(markup, /Unable to load actors\./)
  assert.doesNotMatch(markup, /Check your connection and retry\./)
})

test('Shared async states respect reduced motion preferences', () => {
  const asyncState = readFileSync(
    new URL('../src/shared/components/async-state.tsx', import.meta.url),
    'utf8',
  )

  assert.match(asyncState, /useReducedMotion/)
})

test('Shell and starter surface keep only product-relevant chrome', () => {
  const shell = readFileSync(new URL('../src/app/layouts/app-shell.tsx', import.meta.url), 'utf8')
  const sidebar = readFileSync(
    new URL('../src/app/layouts/app-sidebar.tsx', import.meta.url),
    'utf8',
  )

  assert.doesNotMatch(shell, /backdrop-blur-md/)
  assert.doesNotMatch(sidebar, />Workspace<\/p>/)
  assert.equal(existsSync(new URL('../src/App.css', import.meta.url)), false)
  assert.equal(existsSync(new URL('../src/assets/vite.svg', import.meta.url)), false)
})

test('Operational copy stays concise and free of scaffold wording', () => {
  const runner = readFileSync(
    new URL('../src/features/simulation_runner/simulation-entry-page.tsx', import.meta.url),
    'utf8',
  )
  const documentation = readFileSync(
    new URL('../src/features/documentation/documentation-page.tsx', import.meta.url),
    'utf8',
  )
  const documentEditor = readFileSync(
    new URL('../src/features/simulation_runner/document/document-editor.tsx', import.meta.url),
    'utf8',
  )

  assert.doesNotMatch(runner, /simulation simulation\(s\) ready/)
  assert.doesNotMatch(documentation, />Browse<\/span>/)
  assert.doesNotMatch(documentEditor, /New pages are added at the end of this document\./)
})

test('Shared visual language avoids gradient naming and encoding noise', () => {
  const styles = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
  const runner = readFileSync(
    new URL('../src/features/simulation_runner/simulation-entry-page.tsx', import.meta.url),
    'utf8',
  )

  assert.doesNotMatch(styles, /brand-gradient/)
  assert.doesNotMatch(styles, /drop-shadow\(/)
  assert.doesNotMatch(runner, /Ã|â€¦|â†/)
})

test('Sortable data tables expose their state to assistive technology', () => {
  const dataTable = readFileSync(
    new URL('../src/shared/components/data-table.tsx', import.meta.url),
    'utf8',
  )

  assert.match(dataTable, /aria-sort=/)
  assert.match(dataTable, /aria-label=\{`Sort by \$\{column\.header\}`\}/)
})
