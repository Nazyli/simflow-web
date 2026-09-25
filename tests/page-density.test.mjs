import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import test from 'node:test'

globalThis.React = React

const { PageFrame } = await import('../src/components/layout/page-frame.tsx')

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
