import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const root = new URL('../src/', import.meta.url)

function source(file) {
  return readFileSync(new URL(file, root), 'utf8')
}

test('Studio uses the shared edge-to-edge workbench frame', () => {
  const content = source('features/simulation_studio/simulation-studio-page.tsx')

  assert.match(
    content,
    /import \{ PageFrame \} from ['"]\.\.\/\.\.\/components\/layout\/page-frame['"]/,
  )
  assert.match(
    content,
    /<PageFrame\s+mode="workbench"\s+edgeToEdge\s+className="studio-app-container/,
  )
  assert.match(content, /studio-main-workspace[^\n]*min-h-0[^\n]*min-w-0/)
  assert.match(content, /studio-canvas-area[^\n]*min-h-0[^\n]*min-w-0/)
  assert.match(content, /className="graph[^\n]*!min-h-0[^\n]*min-w-0/)
})

test('Studio workbench avoids decorative glass framing while retaining graph controls', () => {
  const page = source('features/simulation_studio/simulation-studio-page.tsx')
  const edge = source('features/simulation_studio/simulation-graph-edge.tsx')

  assert.doesNotMatch(page, /backdrop-blur-(?:md|sm)/)
  assert.doesNotMatch(edge, /backdrop-blur-sm/)
  assert.match(page, /aria-label="Zoom slider"/)
  assert.match(page, /title="Validate Graph Structure"/)
  assert.match(page, /title="Arrange nodes automatically"/)
})

test('palette groups expose presentation density without changing drag metadata', () => {
  const palette = source('features/simulation_studio/node-palette.ts')
  const page = source('features/simulation_studio/simulation-studio-page.tsx')

  assert.match(palette, /density: 'compact' \| 'regular'/)
  assert.match(palette, /const density: NodePaletteGroup\['density'\] = entries\.length >= 6/)
  assert.match(page, /group\.density === 'compact'/)
  assert.match(page, /PALETTE_NODE_PARAMETERS_DATA/)
  assert.match(page, /PALETTE_NODE_TYPE_DATA/)
})
