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

test('Documentation uses compact density without sacrificing article readability', () => {
  const documentation = readFileSync(
    new URL('../src/features/documentation/documentation-page.tsx', import.meta.url),
    'utf8',
  )

  assert.ok(/<PageFrame mode="reference" density="compact" className=/.test(documentation))
})

test('Documentation articles use compact readable typography', () => {
  const styles = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

  assert.match(
    styles,
    /\.documentation-article \{[\s\S]*font-size: 0\.875rem;[\s\S]*line-height: 1\.6;/,
  )
  assert.match(
    styles,
    /\.documentation-article h1 \{[\s\S]*font-size: clamp\(1\.45rem, 2\.5vw, 2rem\);/,
  )
  assert.match(styles, /\.documentation-article h2 \{[\s\S]*font-size: 1\.15rem;/)
  assert.match(styles, /\.documentation-article h3 \{[\s\S]*font-size: 1rem;/)
})

test('Simulation registry cards keep responsive hierarchy and mobile action targets', () => {
  const simulationList = readFileSync(
    new URL('../src/features/simulation_studio/simulation-list-page.tsx', import.meta.url),
    'utf8',
  )

  assert.match(simulationList, /grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4/)
  assert.doesNotMatch(simulationList, /min-h-\[238px\]/)
  assert.match(simulationList, /group flex min-w-0 flex-col rounded-sm/)
  assert.match(simulationList, /hover:-translate-y-0\.5/)
  assert.equal(
    (simulationList.match(/max-\[640px\]:min-h-11 max-\[640px\]:min-w-11/g) ?? []).length,
    2,
    'Edit and delete controls should each keep a 44px mobile touch target',
  )
})

test('Studio registry uses one concise hero heading instead of a duplicate page header', () => {
  const simulationList = readFileSync(
    new URL('../src/features/simulation_studio/simulation-list-page.tsx', import.meta.url),
    'utf8',
  )

  assert.doesNotMatch(simulationList, /<PageHeader/)
  assert.match(simulationList, /<h1 className=/)
  assert.match(simulationList, /New simulation/)
  assert.doesNotMatch(simulationList, /Start a new build/)
  assert.match(simulationList, /max-w-\[1500px\] space-y-3/)
  assert.match(simulationList, /border-y border-slate-200 py-2\.5 text-sm/)
  assert.match(simulationList, /min-w-0 flex-1 text-left/)
  assert.doesNotMatch(simulationList, />Simulation group<\/p>/)
  assert.doesNotMatch(simulationList, /mt-auto flex items-end justify-between/)
})

test('Runner stacks its entry panels before the tablet breakpoint', () => {
  const styles = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

  assert.match(
    styles,
    /@media \(max-width: 760px\)\s*\{\s*\.runner-entry-grid\s*\{\s*grid-template-columns: minmax\(0, 1fr\);/,
  )
})

test('Compact pages reduce data-table cell padding at every viewport size', () => {
  const styles = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

  assert.match(
    styles,
    /\.app-density-compact \.app-data-table \[data-slot='table-cell'\]\s*\{\s*padding-block: 6px;/,
  )
})

test('Operational data tables keep headers and cells compact', () => {
  const dataTable = readFileSync(
    new URL('../src/shared/components/data-table.tsx', import.meta.url),
    'utf8',
  )

  assert.match(dataTable, /<Table className="min-w-max text-xs">/)
  assert.match(
    dataTable,
    /\[&_th\]:h-8[^\n]*\[&_th\]:px-1\.5[^\n]*\[&_th\]:text-\[11px\][^\n]*\[&_th\]:font-semibold[^\n]*\[&_th\]:tracking-normal/,
  )
  assert.doesNotMatch(dataTable, /\[&_th\]:uppercase/)
  assert.match(dataTable, /text-\[11px\] font-semibold tracking-normal text-slate-500 transition/)
  assert.match(dataTable, /className="px-1\.5 py-1\.5 text-xs text-slate-700"/)
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

test('Product naming and navigation use Simulation Builder task language', () => {
  const shell = readFileSync(new URL('../src/app/layouts/app-shell.tsx', import.meta.url), 'utf8')
  const sidebar = readFileSync(
    new URL('../src/app/layouts/app-sidebar.tsx', import.meta.url),
    'utf8',
  )
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

  assert.match(shell, /Simulation Builder/)
  assert.doesNotMatch(shell, /SimFlow/)
  assert.match(sidebar, />\s*Build & operate\s*</)
  assert.match(sidebar, />\s*Reference\s*</)
  assert.match(index, /<title>Simulation Builder<\/title>/)
})

test('Decision-support metadata stays readable while technical labels can stay compact', () => {
  const summaryStrip = readFileSync(
    new URL('../src/components/layout/summary-strip.tsx', import.meta.url),
    'utf8',
  )
  const documentation = readFileSync(
    new URL('../src/features/documentation/documentation-page.tsx', import.meta.url),
    'utf8',
  )
  const nodeSearch = readFileSync(
    new URL('../src/components/ui/node-search.tsx', import.meta.url),
    'utf8',
  )

  assert.match(summaryStrip, /<dt className="truncate text-xs/)
  assert.match(documentation, /<h2 className="mb-2 flex items-center justify-between px-3 text-xs/)
  assert.match(nodeSearch, /text-muted-foreground truncate text-xs leading-4/)
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
