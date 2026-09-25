# Standard-Zoom UI Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make non-Documentation desktop pages feel more compact at Chrome's 100% zoom while preserving readable type and usable controls.

**Architecture:** Add a compact/comfortable density variant to the shared `PageFrame`, defaulting application pages to compact and opting Documentation out. Scope desktop-only font-token and layout refinements to compact frames so routes retain their current responsive behavior and the Documentation article remains unchanged.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, CSS, Node test runner through `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-25-standard-zoom-density-design.md`

## Global Constraints

- Apply compact density only at desktop widths (`min-width: 901px`).
- Documentation typography, article measure, navigation, and spacing remain unchanged.
- Do not scale the whole application with CSS transforms or globally shrink the browser root font size.
- Preserve control and icon-button hit areas.
- Keep existing typography and responsive behavior on tablet and mobile.
- Do not change behavior, routes, API contracts, or data handling.

## Review Focus

- Documentation accidentally inherits compact typography through shared primitives — verify comfortable density is rendered for its frame.
- Portalled Dialog/Select/Popover content misses page-scoped tokens — verify form and overlay typography in an open dialog.
- Tablet/mobile spacing changes due to an unscoped rule — verify the density media query starts at 901px.
- Tiny metadata becomes harder to read — ensure explicit micro-label sizes are not reduced and standard text-xs remains 12px.
- Interactive controls become undersized — reduce surrounding spacing only, not control hit areas.
- Auto-height text buttons lose their target height with smaller line boxes — verify the Runner start button remains 36px.
- Studio/Runner canvas loses useful workspace area — compact only the frame and shared text/toolbar rhythm; do not change canvas dimensions.

---

### Task 1: Add desktop compact-density variant to shared pages

**Files:**

- Modify: `src/components/layout/page-frame.tsx`
- Modify: `src/features/documentation/documentation-page.tsx`
- Modify: `src/index.css`
- Modify: `src/components/layout/page-header.tsx`
- Modify: `src/components/layout/surface-section.tsx`
- Modify: `src/components/layout/summary-strip.tsx`
- Modify: `src/shared/components/data-table.tsx`
- Test: `tests/page-density.test.mjs`

**Interfaces:**

- `PageFrame` accepts optional `density?: 'compact' | 'comfortable'`; default is `compact`.
- Documentation passes `density="comfortable"`; all existing callers keep the compact default.
- Compact density is represented by `app-density-compact` on the frame and has effects only inside the desktop media query.

- [x] **Step 1: Write the failing render test**

```js
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import React, { createElement } from 'react'
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
```

- [x] **Step 2: Run the focused test and confirm the missing density behavior fails**

Run: `npx tsx --test tests/page-density.test.mjs`
Expected: FAIL because `PageFrame` does not yet render the compact density class or accept the opt-out.

- [x] **Step 3: Add the density prop and opt Documentation out**

Add the `PageFrame` density union with a compact default, attach `app-density-compact` only for compact frames, and pass `density="comfortable"` from `DocumentationPage`.

- [x] **Step 4: Add desktop-only density tokens and shared spacing refinements**

Inside `@media (min-width: 901px)`, scope overrides to `.app-density-compact` and active page-owned portal surfaces: set `--text-sm: 0.8125rem`, `--text-base: 0.9375rem`, `--text-lg: 1.0625rem`, `--text-xl: 1.125rem`, and `--text-2xl: 1.375rem`; keep `--text-xs` unchanged. Let responsive typography utilities resolve their own scale rather than overriding descendant font-size classes. Reduce compact frame padding from 24px to 20px, operations rhythm from 24px to 20px, reference rhythm from 32px to 28px, and tighten shared header/section/summary/table spacing by roughly one 4px step. Give auto-height text buttons a 36px minimum height; preserve fixed control dimensions and fixed micro-label sizes. Record the compact-density variant in `DESIGN.md`.

- [x] **Step 5: Run the focused test and check the generated responsive styles**

Run: `npx tsx --test tests/page-density.test.mjs`
Expected: PASS for default compact mode and Documentation opt-out. At 1440px in the browser, confirm the Runner actor input is 13px and 36px tall, the auto-height Start button is 13px and at least 36px tall, and a portalled Create Simulation dialog input is 13px. At 900px and mobile, verify standard text sizes remain unchanged. Inspect CSS to confirm all overrides are under the 901px desktop media query.

- [x] **Step 6: Run frontend verification**

Run: `npm test`, `npm run build`, and targeted `npx prettier --check` plus `npx oxlint` on changed TSX/CSS/test files. Expected: all pass; inspect desktop, tablet, and mobile layouts in the browser, including Documentation.
