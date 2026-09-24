# Full Application UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved restrained SaaS visual system across every application surface except the already-redesigned sidebar, while preserving all routes, data flows, and business logic.

**Architecture:** Add a small presentation-only surface layer for page framing, headers, toolbars, summaries, and meaningful content sections. Adapt each route to one of three modes—Workbench, Operations, or Reference/Configuration—without moving data fetching, navigation, or domain decisions into the new primitives. Keep the existing shadcn components as the source for controls, dialogs, tabs, tables, and menus.

**Tech Stack:** React, TypeScript, React Router, Tailwind CSS, existing shadcn-style components, Plus Jakarta Sans Variable, Node test runner, TypeScript/Vite build.

**Spec:** `docs/superpowers/specs/2026-09-24-full-application-ui-redesign-design.md`

## Global Constraints

- Preserve existing functionality, routes, API behavior, and business logic.
- Prefer hierarchy through typography, spacing, alignment, and contrast.
- Avoid nested cards, decorative gradients, glassmorphism, glow, and ornamental badges.
- Keep the interface dense enough for daily operational use without becoming cramped.
- Use the existing 4px spacing rhythm.
- Default page padding: 24px desktop, 18px tablet, 12px mobile.
- Use `6px–10px` radius for controls and structural surfaces.
- The sidebar visual redesign and navigation taxonomy are out of scope.
- Tables use local horizontal scrolling only when the data genuinely requires it; the application shell must not create page-level horizontal scrolling.
- Do not change route definitions, API calls, API payloads, query keys, or domain state transitions.

## Review Focus

- Long simulation, actor, and document names must truncate or wrap without expanding the application shell; verify on Studio, Runner, History, and Documentation at mobile width.
- Dense tables must retain local horizontal scrolling without creating body-level horizontal scrolling; verify History, Timers, and Actors.
- Workbench panels must preserve usable canvas/editor space when the sidebar is collapsed or the viewport is narrow; verify Studio and Runner.
- Dialogs, destructive actions, loading states, and error states must retain their existing semantics and focus behavior after surface wrappers are introduced; verify Settings, Timers, Studio, and Actors.
- Reduced-motion and keyboard focus behavior must remain visible and non-disruptive; verify shared buttons, tabs, navigation controls, and workbench controls.

---

## File Map

### Create

- `src/components/layout/page-frame.tsx` — presentation-only page width, background, responsive padding, and vertical rhythm.
- `src/components/layout/page-header.tsx` — title, description, contextual metadata, and action slots.
- `src/components/layout/page-toolbar.tsx` — compact filters and secondary action alignment.
- `src/components/layout/summary-strip.tsx` — restrained status/count summary layout.
- `src/components/layout/surface-section.tsx` — one meaningful surface boundary without nested-card defaults.

### Modify

- `src/app/layouts/app-shell.tsx` — align the content shell/header with the new page system and preserve the existing sidebar behavior and overflow fix.
- `src/index.css` — consolidate content-level tokens, remove or soften decorative content patterns, preserve graph/history-specific rules, and add shared layout utilities only where Tailwind classes cannot express the existing surface behavior.
- `src/features/simulation_studio/simulation-list-page.tsx` — Operations-style simulation library page.
- `src/features/simulation_studio/simulation-studio-page.tsx` — Workbench shell and editor hierarchy.
- `src/features/simulation_runner/simulation-entry-page.tsx` — Runner entry as a compact Workbench launch surface.
- `src/features/simulation_runner/simulation-home-page.tsx` — Runner home hierarchy without dashboard-card excess.
- `src/features/simulation_runner/simulation-info-panel.tsx` — compact contextual information treatment.
- `src/features/simulation_runner/simulation-selection-panel.tsx` — dense selection controls and group spacing.
- `src/features/simulation_runner/chat/*.tsx` — chat workspace controls and message surfaces.
- `src/features/simulation_runner/email/*.tsx` — email workspace controls, message surfaces, and attachment states.
- `src/features/simulation_runner/call/*.tsx` — call workspace header, participant state, and controls.
- `src/features/simulation_runner/document-channel-page.tsx` and `src/features/simulation_runner/document/*.tsx` — document workspace hierarchy.
- `src/features/history/participant-history-page.tsx` — Operations-style history list.
- `src/features/history/execution-detail-page.tsx` — detail layout and tabs without page-level overflow.
- `src/features/history/participant-flow-view.tsx` — flow surface framing only; preserve graph behavior and animation semantics.
- `src/features/timers/timer-management-page.tsx` — Operations-style timer page.
- `src/features/master_data/master-actors-page.tsx` — Operations-style actors table and empty state.
- `src/features/documentation/documentation-page.tsx` — Reference reading layout and navigation hierarchy.
- `src/features/settings/settings-page.tsx` — Configuration sections and action feedback.
- `src/shared/components/data-table.tsx` — shared table container density and local overflow behavior.

### Test and verification surfaces

- `tests/*.test.mjs` — extend only when a changed presentation helper has a deterministic behavior contract; do not add browser-only tests for static class arrangement.
- `src/components/layout/*.tsx` — type-check through the existing Vite build and verify through route-level manual inspection.

## Task 1: Add shared application surface primitives

**Files:**

- Create: `src/components/layout/page-frame.tsx`
- Create: `src/components/layout/page-header.tsx`
- Create: `src/components/layout/page-toolbar.tsx`
- Create: `src/components/layout/summary-strip.tsx`
- Create: `src/components/layout/surface-section.tsx`
- Modify: `src/index.css` only for shared tokens that cannot be represented by existing Tailwind classes

**Interfaces:**

- `PageFrame({ children, className, mode })` renders a `main`-compatible wrapper with `min-w-0`, the application canvas background, and responsive padding. `mode` is `'workbench' | 'operations' | 'reference'` and controls only spacing density.
- `PageHeader({ title, description, eyebrow?, metadata?, actions?, className })` renders semantic heading content and an optional action slot. It must not fetch data or navigate.
- `PageToolbar({ children, className })` aligns filters and secondary controls with wrapping behavior at narrow widths.
- `SummaryStrip({ items, className })` receives `{ label: string; value: ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' }[]` and renders compact summaries without forcing card shadows.
- `SurfaceSection({ children, title?, description?, actions?, className })` renders a single meaningful boundary. It must not add a nested white card when the parent already supplies a surface.

- [ ] **Step 1: Inspect the existing `cn` utility and shared component conventions.**

  Confirm the new files use the existing class-merging utility and do not introduce a second styling helper.

- [ ] **Step 2: Implement `PageFrame` with the approved responsive rhythm.**

  Use `min-w-0`, `max-w-none`, `bg-[#F6F8FB]`, and responsive padding equivalent to `p-6`, `max-[900px]:px-[18px] max-[900px]:py-[22px]`, and `max-[620px]:p-3`. Use a denser workbench mode that can opt out of the outer padding when the existing canvas requires edge-to-edge space.

- [ ] **Step 3: Implement `PageHeader` and `PageToolbar`.**

  Keep title sizes in the `text-lg`/`text-xl` range, use `min-w-0` on text groups, place actions in a wrapping flex row, and ensure buttons never create horizontal page overflow.

- [ ] **Step 4: Implement `SummaryStrip` and `SurfaceSection`.**

  Use border and spacing as the default grouping mechanism. Add a surface background only when the section actually separates content from the page canvas.

- [ ] **Step 5: Run type-check/build and the existing test suite.**

  Run `npm test` and `npm run build` from `simflow-web`. Expected result: 107 existing tests pass and the Vite build exits with code 0.

- [ ] **Step 6: Run the Impeccable detector on the new layout files.**

  Run `node C:\Users\User\.agents\skills\impeccable\scripts\detect.mjs --json src/components/layout`. Expected result: no unexplained findings.

## Task 2: Normalize the application shell and content overflow

**Files:**

- Modify: `src/app/layouts/app-shell.tsx`
- Modify: `src/components/ui/sidebar.tsx` only if the existing primitive prevents the content shell from shrinking; do not change sidebar visual treatment
- Modify: `src/index.css` only if a global body/content overflow rule is required

**Interfaces:**

- Consumes the existing `SidebarProvider`, `SidebarInset`, `SidebarTrigger`, `AppSidebar`, and `Breadcrumb`.
- Produces an application shell where the sidebar remains unchanged, the main content can shrink, and page-level horizontal scrolling is prevented.

- [ ] **Step 1: Replace ad hoc shell padding with `PageFrame`-compatible content constraints.**

  Keep the existing sticky header and breadcrumb behavior. Preserve `min-w-0`, `overflow-x-hidden`, and the sidebar z-index fix already present. Do not change route links or sidebar items.

- [ ] **Step 2: Verify header/sidebar stacking and responsive behavior.**

  Inspect the shell at desktop, tablet, and mobile widths. Confirm the header never overlays the sidebar because of page-level horizontal scroll, while local table/canvas scroll regions remain available.

- [ ] **Step 3: Run `npm test`, `npm run build`, and `git diff --check`.**

  Expected result: no test regressions, build exit code 0, and no whitespace errors.

## Task 3: Redesign Operations pages

**Files:**

- Modify: `src/features/simulation_studio/simulation-list-page.tsx`
- Modify: `src/features/history/participant-history-page.tsx`
- Modify: `src/features/history/execution-detail-page.tsx`
- Modify: `src/features/timers/timer-management-page.tsx`
- Modify: `src/features/master_data/master-actors-page.tsx`
- Modify: `src/shared/components/data-table.tsx`

**Interfaces:**

- Each page keeps its existing query hooks, mutations, handlers, columns, dialogs, and route navigation.
- Pages consume `PageFrame`, `PageHeader`, `PageToolbar`, `SummaryStrip`, and `SurfaceSection` only for presentation.
- `DataTable` keeps its existing generic row/column contract and only changes layout classes and overflow boundaries.

- [ ] **Step 1: Convert each page root to `PageFrame mode="operations"`.**

  Remove repeated `min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5` declarations from the page roots and move those responsibilities into `PageFrame`.

- [ ] **Step 2: Replace large white header cards with `PageHeader`.**

  Keep current titles, descriptions, icons, actions, and loading/error copy. Place the primary action beside the title on wide screens and below it on narrow screens. Do not add new marketing copy.

- [ ] **Step 3: Replace repeated status cards with `SummaryStrip`.**

  Preserve all existing status counts and labels. Use subtle text/value hierarchy and small separators instead of six or seven elevated cards.

- [ ] **Step 4: Make table boundaries explicit and local.**

  Keep `overflow-x-auto` on the table container only. Add `min-w-0` to surrounding flex/grid children. Ensure JSON/output cells and long IDs wrap or truncate without expanding the document body.

- [ ] **Step 5: Simplify empty, loading, and error states.**

  Preserve current recovery actions and messages. Use compact text-first states with one meaningful action; do not add illustrations or oversized CTA blocks.

- [ ] **Step 6: Verify Operations routes.**

  Check `/studio`, `/history`, `/history/:id`, `/timers`, and `/master-data/actors` at desktop and mobile widths. Run `npm test` and `npm run build`.

## Task 4: Redesign the Studio Workbench

**Files:**

- Modify: `src/features/simulation_studio/simulation-studio-page.tsx`
- Modify: `src/features/simulation_studio/simulation-graph-edge.tsx` for visual edge-label and selected-state classes only; do not change path or port logic
- Modify: `src/features/simulation_studio/node-configuration-form.tsx` for configuration panel presentation
- Modify: `src/features/simulation_studio/node-palette.ts` for palette density/presentation metadata only
- Modify: `src/features/simulation_studio/simulation-graph-node.tsx` for node surface presentation only
- Modify: `src/features/simulation_studio/workflow-package-dialog.tsx` for dialog presentation only
- Modify: `src/features/simulation_studio/document-preview-dialog.tsx` for dialog presentation only

**Interfaces:**

- Preserve React Flow state, graph mutations, autosave, validation, export, import, node configuration, dialogs, and keyboard interactions.
- Workbench framing must be presentation-only and must not move graph state into a new layout primitive.

- [ ] **Step 1: Identify the current editor regions.**

  Map the existing top toolbar, palette, graph canvas, configuration panel, validation area, and dialogs before changing class names. Keep their DOM/focus order unless a visual-only wrapper is required.

- [ ] **Step 2: Apply `PageFrame mode="workbench"` and a compact workbench toolbar.**

  Reduce decorative framing and make the canvas/editor the primary visual surface. Keep actions grouped by task: simulation lifecycle, validation, import/export, and node configuration.

- [ ] **Step 3: Normalize panel proportions and borders.**

  Use one border system, restrained radius, and no nested shadowed cards. Add `min-w-0`/`min-h-0` at flex boundaries so graph and panels can shrink without page overflow.

- [ ] **Step 4: Preserve graph-specific visuals.**

  Do not change port semantics, edge routing, node behavior, group behavior, or selected states. Only reduce decorative effects that do not communicate graph state.

- [ ] **Step 5: Verify Studio interaction paths.**

  Confirm node drag/drop, selection, configuration save, validation, grouping, zoom/pan, export/import, and responsive collapse behavior. Run `npm test`, `npm run build`, and the detector on changed Studio files.

## Task 5: Redesign the Runner Workbench

**Files:**

- Modify: `src/features/simulation_runner/simulation-entry-page.tsx`
- Modify: `src/features/simulation_runner/simulation-home-page.tsx`
- Modify: `src/features/simulation_runner/simulation-info-panel.tsx`
- Modify: `src/features/simulation_runner/simulation-selection-panel.tsx`
- Modify: `src/features/simulation_runner/chat/*.tsx`
- Modify: `src/features/simulation_runner/email/*.tsx`
- Modify: `src/features/simulation_runner/call/*.tsx`
- Modify: `src/features/simulation_runner/document-channel-page.tsx`
- Modify: `src/features/simulation_runner/document/*.tsx`

**Interfaces:**

- Preserve participant/session selection, channel routing, SSE/live updates, call connection behavior, composer actions, attachments, document interactions, and existing API payloads.
- Use the same Workbench density and control proportions as Studio without copying Studio-specific content.

- [ ] **Step 1: Convert Runner entry and home pages to the Workbench surface.**

  Keep simulation selection and participant generation behavior. Replace the large card header and oversized selection blocks with a compact title/action row and a clear selection surface.

- [ ] **Step 2: Normalize shared Runner side panels and info panels.**

  Keep selection groups, counts, and actor labels. Use `min-w-0`, restrained borders, and consistent compact controls. Preserve the approved `grid-cols-4` group layout where it improves scanning.

- [ ] **Step 3: Normalize Chat, Email, Call, and Document channel shells.**

  Establish a common channel header/action rhythm while retaining channel-specific controls. Keep email preview typography isolated as an email document concern, but align its surrounding app chrome with the shared system.

- [ ] **Step 4: Verify live interaction states.**

  Check loading, waiting, error, connected, disconnected, empty, and composer-disabled states. Confirm mobile channel navigation does not cause body-level horizontal scrolling.

- [ ] **Step 5: Run the full frontend test/build checks.**

  Run `npm test` and `npm run build`. Review changed Runner files with the Impeccable detector.

## Task 6: Redesign Reference and Configuration pages

**Files:**

- Modify: `src/features/documentation/documentation-page.tsx`
- Modify: `src/features/settings/settings-page.tsx`

**Interfaces:**

- Preserve documentation search, section navigation, Markdown rendering, pager links, settings reset behavior, dialog confirmation, and API calls.
- Use `PageFrame mode="reference"`, `PageHeader`, and `SurfaceSection` for presentation only.

- [ ] **Step 1: Reframe Documentation as a reading surface.**

  Keep the navigation/search region stable while constraining the article measure. Reduce dashboard-like chrome and preserve code block, table, diagram, and link readability.

- [ ] **Step 2: Reframe Settings as configuration sections.**

  Keep the reset action and confirmation dialog. Use a direct page heading and one section with clear destructive-action hierarchy; do not add account/settings cards that have no behavior.

- [ ] **Step 3: Verify reference/configuration routes.**

  Check `/documentation`, `/documentation/:slug`, and `/settings` at desktop, tablet, and mobile widths. Confirm search, navigation, dialog focus, and long Markdown content remain usable.

## Task 7: Cross-surface quality pass

**Files:**

- Modify only files with verified defects from Tasks 1–6.
- Do not modify `src/app/layouts/app-sidebar.tsx` unless a regression is proven in the existing sidebar behavior.

- [ ] **Step 1: Run the complete frontend test suite.**

  Run `npm test` and record the exact pass/fail count.

- [ ] **Step 2: Run the production build.**

  Run `npm run build` and confirm TypeScript and Vite both exit successfully.

- [ ] **Step 3: Run the Impeccable detector across changed UI files.**

  Run `node C:\Users\User\.agents\skills\impeccable\scripts\detect.mjs --json` with the changed files/directories. Investigate every finding; do not suppress findings merely to produce a clean report.

- [ ] **Step 4: Run `git diff --check` and inspect the final diff.**

  Confirm there are no whitespace errors, accidental route/API changes, backend files, sidebar redesign changes, or unrelated generated files.

- [ ] **Step 5: Perform the responsive acceptance pass.**

  Inspect a representative route from each mode at desktop, tablet, and mobile widths. Confirm body-level horizontal scrolling is absent, local table/canvas scrolling remains intentional, focus rings remain visible, and action groups wrap cleanly.

- [ ] **Step 6: Commit the implementation in cohesive batches.**

  Use focused commits such as:

  ```text
  feat(frontend): add shared application surface primitives
  feat(frontend): refine operations pages
  feat(frontend): refine studio workbench
  feat(frontend): refine runner workbench
  feat(frontend): refine documentation and settings
  ```
