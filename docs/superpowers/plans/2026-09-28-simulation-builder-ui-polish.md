# Simulation Builder UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the frontend consistently present itself as Simulation Builder, remain safe on mobile, and replace generic card-dashboard cues with a compact workflow registry.

**Architecture:** Keep existing React/Tailwind/shadcn primitives and API behavior. Limit changes to user-facing naming, navigation labels, responsive CSS, shared metadata typography, and the Studio list presentation. Preserve technical small text only where it represents IDs, ports, or renderer metadata.

**Tech Stack:** React 19, React Router, Tailwind CSS 4, shadcn-style primitives, Node test runner, Vite.

**Spec:** `docs/superpowers/specs/2026-09-27-frontend-ai-slop-audit-design.md`

## Global Constraints

- User-facing product name is `Simulation Builder`; do not introduce `SimFlow` in frontend copy.
- Backend, API contracts, workflow behavior, and database code remain untouched.
- Runner profile and simulation picker stack at `max-width: 760px`.
- Primary mobile actions and content controls retain 44px touch targets; dense canvas utility controls may use a compact 32px target so the graph remains usable on narrow screens.
- Visible decision-support metadata uses at least 12px; technical IDs/ports may remain smaller.

## Review Focus

- 485px viewport: Runner panels must not remain side-by-side or clip form fields.
- Branding: shell, sidebar, browser title, and docs must use the same product name.
- Studio list density: workflow groups must scan as an operational registry, not a card gallery.
- Compact metadata: labels must remain readable while technical secondary values may stay dense.
- Existing API and navigation paths: presentation-only changes must not alter route or request contracts.

### Task 1: Regression tests for naming, responsive layout, and density

**Files:**

- Modify: `tests/page-density.test.mjs`

- [x] Write tests that assert the Simulation Builder naming, task-oriented navigation labels, 760px Runner breakpoint, readable metadata, and list-row presentation.
- [x] Run `npm test` first; the new assertions failed against the current naming, 480px breakpoint, tiny metadata, and card grid.

### Task 2: Product naming and task-oriented navigation

**Files:**

- Modify: `index.html`
- Modify: `src/app/layouts/app-shell.tsx`
- Modify: `src/app/layouts/app-sidebar.tsx`
- Modify: `public/documentation/00-index.md`
- Modify: `public/documentation/01-pengenalan.md`

- [x] Replace user-facing `SimFlow` with `Simulation Builder` in shell and sidebar.
- [x] Rename sidebar group labels to `Build & operate` and `Reference`.
- [x] Verify documentation title and introduction already use the official product name.
- [x] Run the focused page-density tests; naming assertions pass.

### Task 3: Responsive Runner and readable metadata

**Files:**

- Modify: `src/index.css`
- Modify: `src/components/layout/summary-strip.tsx`
- Modify: `src/features/documentation/documentation-page.tsx`
- Modify: `src/components/ui/node-search.tsx`

- [x] Change the Runner stacking breakpoint to 760px.
- [x] Raise decision-support metadata from 10–11px to `text-xs`, retaining smaller technical values only where useful.
- [x] Run focused tests; responsive and metadata assertions pass.

### Task 4: Workflow registry presentation

**Files:**

- Modify: `src/features/simulation_studio/simulation-list-page.tsx`

- [x] Replace the repeated responsive card grid with a compact full-width workflow registry using dividers and one primary action row per group.
- [x] Keep edit/delete actions accessible and 44px on mobile.
- [x] Preserve group opening, version picker, status labels, lock semantics, and all mutation/API behavior.
- [x] Run focused tests; registry-row assertions pass.

### Task 5: Full verification

- [x] Run `npm test` (165 passed).
- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Preview the Runner mobile breakpoint and inspect the main frontend routes from the second audit.
- [x] Confirm only frontend files and this plan/spec changed; no backend code is touched.

### Task 6: Compact Documentation typography

**Files:**

- Modify: `src/index.css:104-220`
- Test: `tests/page-density.test.mjs`

**Interfaces:**

- Consumes: Existing `.documentation-article` renderer output and the shared Plus Jakarta Sans typography tokens.
- Produces: A readable compact documentation article style with 14px body text, tighter line-height, smaller headings, and reduced block spacing.

- [x] **Step 1: Write the failing test**

  Add a static regression assertion that `.documentation-article` uses `font-size: 0.875rem`, `line-height: 1.6`, a compact `h1`, and a compact `h2`.

- [x] **Step 2: Run the test to verify it fails**

  Run `npm test`; expected: the new documentation typography assertion fails against the current 0.96rem/1.75 article styles.

- [x] **Step 3: Write the minimal implementation**

  Update only the documentation article CSS: set body text to `0.875rem` with `1.6` line-height, reduce h1/h2/h3 sizes and margins, tighten paragraph/list/code/table spacing, and use compact PageFrame density without changing Markdown content or responsive overflow behavior.

- [x] **Step 4: Run verification**

  Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check`; expected: all commands pass, with only the existing Vite large-chunk advisory if emitted.

### Task 7: Compact operational table typography

**Files:**

- Modify: `src/shared/components/data-table.tsx`
- Test: `tests/page-density.test.mjs`
- Test: `tests/operations-layout.test.mjs`

- [x] Add a regression assertion for compact table headers, cells, row height, and removal of visual uppercase/tracking noise.
- [x] Change shared operational DataTable headers to 11px semibold sentence case, cells to 12px, and reduce table padding while preserving sorting, selection, and local overflow.
- [x] Verify with `npm test` (167 passed), `npm run lint`, `npm run build`, `git diff --check`, and a visual `/history` QA pass.

### Task 8: Compact mobile canvas toolbars

**Files:**

- Modify: `src/features/simulation_studio/simulation-studio-page.tsx`
- Modify: `src/index.css`
- Test: `tests/studio-workbench-layout.test.mjs`

- [x] Add regression assertions that the Studio floating canvas controls and shared React Flow controls do not expand to 44px at the 760px breakpoint.
- [x] Reduce Studio/History canvas utility controls, node search, and flow toolbar actions to 24px on mobile; keep generic command dialogs and unrelated content controls out of this scoped change.
- [x] Place node search in the canvas top-right, aligned with the graph toolbar on desktop and mobile.
- [x] Verify at a 485px viewport in Studio and History flow: toolbars stay on one compact row where possible, controls remain visible, and the canvas still has room for the graph.
