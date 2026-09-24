import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const root = new URL('../src/', import.meta.url)

function source(file) {
  return readFileSync(new URL(file, root), 'utf8')
}

test('the shared shell owns the Runner main landmark', () => {
  const sidebar = source('components/ui/sidebar.tsx')
  const appShell = source('app/layouts/app-shell.tsx')
  const entry = source('features/simulation_runner/simulation-entry-page.tsx')
  const layout = source('features/simulation_runner/simulation-run-layout.tsx')

  assert.match(sidebar, /const SidebarInset[\s\S]*?<main\b/)
  assert.match(appShell, /<SidebarInset[\s\S]*?<div className="app-content/)
  assert.doesNotMatch(entry, /<main\b/)
  assert.doesNotMatch(layout, /<main\b/)
})

test('Runner home and info panel keep a single page-level heading', () => {
  const home = source('features/simulation_runner/simulation-home-page.tsx')
  const info = source('features/simulation_runner/simulation-info-panel.tsx')

  assert.match(home, /<PageHeader\s+title="Participant workspace"/)
  assert.match(info, /<h2\s+className="min-w-0 truncate/)
  assert.doesNotMatch(info, /<h1\b/)
})

test('in-call chat toggle exposes its current state to assistive technology', () => {
  const content = source('features/simulation_runner/call/ai-agent-header.tsx')

  assert.match(
    content,
    /aria-label=\{chatOpen \? 'Hide in-call messages' : 'Show in-call messages'\}/,
  )
  assert.match(content, /aria-pressed=\{chatOpen\}/)
})

test('Runner microphone and camera toggles retain a 44px touch target', () => {
  const content = source('features/simulation_runner/call/media-control-bar.tsx')

  assert.equal((content.match(/className=\{`grid size-11/g) ?? []).length, 2)
})

test('Runner entry header contains no ornamental static pills', () => {
  const content = source('features/simulation_runner/simulation-entry-page.tsx')

  assert.doesNotMatch(content, /Participant launch surface/)
  assert.doesNotMatch(content, /Session setup/)
})
