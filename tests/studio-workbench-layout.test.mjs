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

test('Studio nodes keep React Flow handles outside the text clipping region', () => {
  const node = source('features/simulation_studio/simulation-graph-node.tsx')

  assert.doesNotMatch(node, /<BaseNode[^>]*overflow-hidden/)
  assert.match(node, /BaseNodeContent className="[^"]*min-w-0/)
  assert.match(node, /line-clamp-2/)
})

test('Studio sidebars become overlays below the workbench breakpoint', () => {
  const page = source('features/simulation_studio/simulation-studio-page.tsx')

  assert.match(page, /studio-left-sidebar[^\n]*max-\[1100px\]:absolute/)
  assert.match(page, /studio-left-sidebar[^\n]*max-\[1100px\]:min-w-0/)
  assert.match(page, /studio-right-sidebar[^\n]*max-\[1100px\]:absolute/)
  assert.match(page, /studio-right-sidebar[^\n]*max-\[1100px\]:min-w-0/)
})

test('Studio prevents two narrow sidebar overlays from being open together', () => {
  const page = source('features/simulation_studio/simulation-studio-page.tsx')

  assert.match(page, /const STUDIO_NARROW_VIEWPORT_QUERY = ['"]\(max-width: 1100px\)['"]/)
  assert.match(page, /matchMedia\(STUDIO_NARROW_VIEWPORT_QUERY\)/)
  assert.match(page, /setLeftSidebarOpen\(false\)/)
  assert.match(page, /setRightSidebarOpen\(false\)/)
  assert.match(page, /toggleLeftSidebar/)
  assert.match(page, /toggleRightSidebar/)
  assert.match(page, /if \(narrowViewport && !leftSidebarOpen\) setRightSidebarOpen\(false\)/)
  assert.match(page, /if \(narrowViewport && !rightSidebarOpen\) setLeftSidebarOpen\(false\)/)
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
