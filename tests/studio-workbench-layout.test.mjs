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

test('workflow edge labels use tighter padding and translucent backgrounds', () => {
  const edge = source('features/simulation_studio/simulation-graph-edge.tsx')
  const styles = source('index.css')

  assert.match(edge, /rounded-md border border-slate-200 bg-white\/75 p-0\.5 shadow-sm/)
  assert.match(edge, /rounded-full px-1 py-0 text-\[0\.65rem\] font-medium/)
  assert.match(edge, /bg-\[#F5E7FF\]\/80/)
  assert.match(styles, /\.history-edge-label--participant \{[^}]*background: rgba\(255, 255, 255, 0\.78\);/)
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

test('Node Palette sidebar uses compact width and dense node cards', () => {
  const page = source('features/simulation_studio/simulation-studio-page.tsx')

  assert.match(page, /leftSidebarOpen \? 'w-56 max-w-\[240px\] min-w-\[220px\]/)
  assert.match(page, /max-\[1100px\]:w-\[min\(15rem,calc\(100vw-1\.5rem\)\)\]/)
  assert.match(page, /className="flex items-center justify-between border-b border-\[#DBE3EC\] p-2"/)
  assert.match(page, /<h2 className="flex items-center gap-1\.5 text-\[10px\] font-bold tracking-wider text-slate-500 uppercase">/)
  assert.match(page, /palette-card-item w-fit max-w-full cursor-grab rounded-md border px-1\.5 py-1/)
  assert.match(page, /<strong className="w-full text-\[10px\] leading-tight font-semibold text-slate-800">/)
})

test('Studio canvas toolbar and node search use compact control sizing', () => {
  const page = source('features/simulation_studio/simulation-studio-page.tsx')
  const history = source('features/history/participant-flow-view.tsx')
  const command = source('components/ui/command.tsx')
  const nodeSearch = source('components/ui/node-search.tsx')

  assert.match(page, /floating-canvas-toolbar[^\n]*gap-0\.5[^\n]*p-0\.5/)
  assert.equal((page.match(/h-\[22px\] w-\[22px\][^\n]*p-0\.5/g) ?? []).length, 5)
  assert.equal(
    (
      page.match(
        /<Minus size=\{11\}\s*\/>|<Plus size=\{11\}\s*\/>|<Maximize size=\{11\}\s*\/>|<Layers size=\{11\}\s*\/>|<MapPin size=\{11\}\s*\/>/g,
      ) ?? []
    ).length,
    6,
  )
  assert.match(
    page,
    /h-\[22px\] cursor-pointer rounded-md border border-\[#DBE3EC\] bg-white px-1 text-\[10px\]/,
  )
  assert.equal((page.match(/min-h-\[22px\] items-center[^\n]*text-\[10px\]/g) ?? []).length, 2)
  assert.match(page, /max-\[760px\]:h-11 max-\[760px\]:w-11/)
  assert.match(page, /max-\[760px\]:min-h-11/)
  assert.match(command, /flex h-9 w-full rounded-md bg-transparent py-2 text-xs/)
  assert.match(command, /max-\[760px\]:h-11/)
  assert.match(nodeSearch, /\[&_\[cmdk-input\]\]:h-7/)
  assert.match(nodeSearch, /\[&_\[cmdk-empty\]\]:text-\[0\.6875rem\]/)
  assert.match(nodeSearch, /\[&_\[cmdk-list\]\]:max-h-44/)
  assert.match(nodeSearch, /\[&_\[cmdk-item\]\]:py-0\.5/)
  assert.match(nodeSearch, /\[&_\[cmdk-input\]\]:text-\[0\.6875rem\]/)
  assert.match(nodeSearch, /\[&_\[cmdk-item\]\]:text-\[0\.6875rem\]/)
  assert.match(nodeSearch, /max-\[760px\]:\[&_\[cmdk-item\]\]:min-h-11/)
  assert.match(nodeSearch, /text-\[10px\] leading-3/)
  assert.equal(
    (
      `${page}\n${history}`.match(
        /w-\[min\(15rem,calc\(100vw-1\.5rem\)\)\][^\n]*md:min-w-\[15rem\]/g,
      ) ?? []
    ).length,
    2,
  )
})

test('Studio and History Flow share compact canvas controls and zoom panel sizing', () => {
  const page = source('features/simulation_studio/simulation-studio-page.tsx')
  const history = source('features/history/participant-flow-view.tsx')
  const styles = source('index.css')

  assert.doesNotMatch(styles, /\.graph \.react-flow__controls \{\s*transform: scale\(1\.15\)/)
  assert.match(styles, /\.graph \.react-flow__controls-button \{\s*width: 24px;\s*height: 24px;/)
  assert.match(styles, /\.graph \.react-flow__controls-button[\s\S]*?@media \(max-width: 760px\)[\s\S]*?width: 44px;\s*height: 44px;/)
  assert.equal((`${page}\n${history}`.match(/flex h-7 items-center gap-1 rounded-md border border-\[#C6D2DF\][^\n]*shadow-sm/g) ?? []).length, 2)
  assert.equal((`${page}\n${history}`.match(/className="w-14 sm:w-18 lg:w-24"/g) ?? []).length, 2)
  assert.equal((`${page}\n${history}`.match(/w-7 shrink-0 text-right text-\[10px\]/g) ?? []).length, 2)
})

test('Studio right sidebar uses a narrower desktop width and compact mobile overlay', () => {
  const page = source('features/simulation_studio/simulation-studio-page.tsx')

  assert.match(page, /rightSidebarOpen \? 'w-\[min\(16rem,28vw\)\] max-w-\[280px\] min-w-\[240px\]/)
  assert.match(page, /max-\[1100px\]:w-\[min\(16rem,calc\(100vw-1\.5rem\)\)\]/)
})

test('Studio prevents two narrow sidebar overlays from being open together', () => {
  const page = source('features/simulation_studio/simulation-studio-page.tsx')

  assert.match(page, /const STUDIO_NARROW_VIEWPORT_QUERY = ['"]\(max-width: 1100px\)['"]/)
  assert.match(page, /matchMedia\(STUDIO_NARROW_VIEWPORT_QUERY\)/)
  assert.match(page, /setLeftSidebarOpen\(false\)/)
  assert.match(page, /setRightSidebarOpen\(false\)/)
  assert.match(page, /useState\(\(\) => !isNarrowStudioViewport\(\)\)/g)
  assert.match(page, /let previousNarrowViewport = mediaQuery\.matches/)
  assert.match(
    page,
    /if \(narrowViewport\) \{[\s\S]*setLeftSidebarOpen\(false\)[\s\S]*setRightSidebarOpen\(false\)[\s\S]*return\n      \}/,
  )
  assert.match(page, /setLeftSidebarOpen\(true\)[\s\S]*setRightSidebarOpen\(true\)/)
  assert.match(page, /toggleLeftSidebar/)
  assert.match(page, /toggleRightSidebar/)
  assert.match(page, /if \(narrowViewport && !leftSidebarOpen\) setRightSidebarOpen\(false\)/)
  assert.match(page, /if \(narrowViewport && !rightSidebarOpen\) setLeftSidebarOpen\(false\)/)
})

test('Studio sidebar tabs shrink to their labels while keeping a compact hit area', () => {
  const page = source('features/simulation_studio/simulation-studio-page.tsx')

  assert.equal((page.match(/tab-btn flex min-h-8 flex-none/g) ?? []).length, 3)
  assert.equal((page.match(/gap-1 rounded-lg px-2 py-1\.5 text-\[11px\]/g) ?? []).length, 3)
})

test('Studio header reserves the brand color for Run and softens supporting actions', () => {
  const page = source('features/simulation_studio/simulation-studio-page.tsx')
  const headerStart = page.indexOf('<header className="studio-top-header')
  const header = page.slice(headerStart, page.indexOf('</header>', headerStart))

  const buttonClasses = (label) => {
    const labelIndex = header.indexOf(label)
    const buttonStart = header.lastIndexOf('<button', labelIndex)
    const className = header.slice(buttonStart, labelIndex).match(/className="([^"]+)"/)?.[1]

    assert.ok(className, `expected ${label} to belong to a styled button`)
    return className
  }

  assert.match(buttonClasses('Run Simulation'), /bg-\[#9929EA\]/)
  assert.match(buttonClasses('Validate'), /border border-\[#C6D2DF\] bg-white/)
  assert.match(buttonClasses('Workflow actions'), /border border-\[#C6D2DF\] bg-white/)
  assert.match(buttonClasses('Duplicate to Edit'), /border-amber-200 bg-amber-50 .*text-amber-800/)
  for (const label of ['Run Simulation', 'Validate', 'Duplicate to Edit']) {
    assert.match(buttonClasses(label), /h-6 items-center gap-1\.5 rounded-md[^"]*px-2 text-\[11px\]/)
  }
  assert.match(buttonClasses('Workflow actions'), /h-6 items-center gap-1 rounded-md[^"]*px-2 text-\[11px\]/)
  assert.equal((header.match(/h-7 w-7 shrink-0 items-center/g) ?? []).length, 2)
})

test('Node configuration header keeps its title left and centers the type badge vertically', () => {
  const form = source('features/simulation_studio/node-configuration-form.tsx')
  const headerStart = form.indexOf(
    '<div className="flex min-w-0 items-center justify-between gap-3 border-b',
  )
  const header = form.slice(headerStart, form.indexOf('<TextField', headerStart))

  assert.match(header, /flex min-w-0 items-center justify-between gap-3/)
  assert.match(header, /flex min-w-0 items-center gap-2/)
  assert.match(header, /h-3\.5 w-3\.5 shrink-0/)
  assert.match(header, /text-xs font-semibold text-slate-900/)
  assert.match(header, /max-w-36 truncate[^"]*text-\[0\.5rem\]/)
})

test('Node configuration fields and actions use compact local sizing', () => {
  const form = source('features/simulation_studio/node-configuration-form.tsx')
  const picker = source('features/simulation_studio/pickers/master-picker-field.tsx')

  assert.match(form, /className="node-configuration-form flex min-w-0 flex-col gap-3/)
  assert.match(form, /\[&_label\]:text-xs/)
  assert.match(form, /\[&_input\]:h-7/)
  assert.match(form, /\[&_input\]:text-xs/)
  assert.match(form, /\[&_textarea\]:min-h-14/)
  assert.match(form, /\[&_button\[data-slot=select-trigger\]\]:text-xs/)
  assert.equal((form.match(/<SelectContent className="\[&_\[data-slot=select-item\]\]:text-xs"/g) ?? []).length, 5)
  assert.equal((form.match(/size="sm"/g) ?? []).length, 5)
  assert.match(form, /<Button type="submit" size="xs"/)
  assert.equal((form.match(/size="icon-xs"/g) ?? []).length, 2)
  assert.equal((picker.match(/size="xs"/g) ?? []).length, 2)
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
