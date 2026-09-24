import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const root = new URL('../src/', import.meta.url)

const pageFiles = [
  'features/simulation_studio/simulation-list-page.tsx',
  'features/history/participant-history-page.tsx',
  'features/history/execution-detail-page.tsx',
  'features/timers/timer-management-page.tsx',
  'features/master_data/master-actors-page.tsx',
]

function source(file) {
  return readFileSync(new URL(file, root), 'utf8')
}

test('operations pages use the shared page framing primitives', () => {
  for (const file of pageFiles) {
    const content = source(file)
    assert.match(content, /PageFrame/)
    assert.match(content, /PageHeader/)
    assert.doesNotMatch(content, /min-h-\[calc\(100vh-64px\)\].*bg-slate-50.*p-5/)
  }
})

test('PageFrame is a non-landmark wrapper for nested application routes', () => {
  const content = source('components/layout/page-frame.tsx')
  assert.match(content, /<div/)
  assert.doesNotMatch(content, /<main/)
})

test('history keeps its compact Layers title icon', () => {
  const content = source('features/history/participant-history-page.tsx')
  assert.match(content, /<PageHeader[\s\S]*<Layers/)
})

test('execution detail keeps early states inside the operations frame', () => {
  const content = source('features/history/execution-detail-page.tsx')
  assert.match(content, /function ExecutionDetailState/)
  assert.match(content, /<ExecutionDetailState[\s\S]*<PageFrame/)
  assert.doesNotMatch(content, /if \(!id\) return <ErrorState/)
  assert.doesNotMatch(content, /if \(history\.isPending\) return <LoadingState/)
})

test('simulation list uses compact text-first async states', () => {
  const content = source('features/simulation_studio/simulation-list-page.tsx')
  assert.doesNotMatch(content, /<LoadingState variant="runner"/)
  assert.doesNotMatch(content, /<EmptyState/)
  assert.match(content, /No simulations yet/)
})

test('history and timers use compact summary strips instead of status cards', () => {
  for (const file of [
    'features/history/participant-history-page.tsx',
    'features/timers/timer-management-page.tsx',
  ]) {
    const content = source(file)
    assert.match(content, /SummaryStrip/)
    assert.doesNotMatch(content, /function StatCard/)
  }
})

test('data table scopes horizontal overflow to the table region', () => {
  const content = source('shared/components/data-table.tsx')
  const table = source('components/ui/table.tsx')
  assert.match(content, /<div className="min-w-0">\s*<Table className="min-w-max">/)
  assert.doesNotMatch(content, /<section className="overflow-x-auto">/)
  assert.match(table, /data-slot="table-container" className="relative w-full overflow-x-auto"/)
})
