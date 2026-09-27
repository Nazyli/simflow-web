# Frontend AI-Slop Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the SimFlow frontend into a compact, readable, consistent operational UI while removing generic copy, decorative AI-slop signals, and avoidable initial-load cost.

**Architecture:** Preserve the existing `Quiet control room` design system and route/API behavior. Centralize typography, control density, semantic colors, async feedback, and motion defaults in shared CSS/components, then update feature surfaces only where they currently drift. Keep runtime graph/audio effects when they communicate status, but remove decorative shell effects.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Radix/shadcn primitives, Framer Motion, Mermaid.

**Spec:** `docs/superpowers/specs/2026-09-27-frontend-ai-slop-audit-design.md`

## Global Constraints

- Backend `simflow-api` is read-only and must not be modified.
- Routes, API contracts, workflow behavior, and data behavior must remain unchanged.
- Plus Jakarta Sans remains the single UI family; body text remains readable while controls become compact.
- Do not add decorative gradients, glass, glow, or heavy shadows to default surfaces.
- Preserve usable touch targets for critical controls and visible keyboard focus.
- Every motion change must respect `prefers-reduced-motion`.
- Use `apply_patch` for source edits; do not auto-format unrelated files.

## Review Focus

- Small text used as instructions: it must remain readable at normal zoom and mobile widths.
- Compact controls: visual height may reduce, but icon-only and touch-critical controls retain usable hit areas.
- Error states: they must describe the actual problem and offer recovery without assuming a network cause.
- Graph/call status effects: removing decoration must not remove runtime status feedback.
- Documentation bundle: Mermaid remains available on documentation routes without inflating the initial route.

### Task 1: Guardrails and shared density foundations

**Files:**

- Create/modify: `tests/page-density.test.mjs`
- Modify: `src/index.css`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/shared/form-classes.ts`
- Modify: `src/shared/components/async-state.tsx`

- [ ] Write failing assertions for compact shared button/control defaults, readable base type, no generic network suffix, and reduced-motion async states.
- [ ] Run the focused test file and confirm it fails for the current implementation.
- [ ] Implement semantic density tokens, compact button/input defaults, contextual error recovery, and reduced-motion-safe shared state transitions.
- [ ] Run focused tests and confirm they pass.

### Task 2: Shell, starter residue, and copy cleanup

**Files:**

- Modify: `src/app/layouts/app-shell.tsx`
- Modify: `src/app/layouts/app-sidebar.tsx`
- Modify: `src/features/documentation/documentation-page.tsx`
- Modify: `src/features/simulation_runner/simulation-entry-page.tsx`
- Modify: `src/features/simulation_runner/document/document-editor.tsx`
- Modify: `src/features/master_data/actor-crud-dialog.tsx`
- Modify: `src/features/settings/settings-page.tsx`
- Modify: `src/features/simulation_studio/simulation-studio-page.tsx`
- Delete after reference scan: `src/App.css`, `src/assets/vite.svg`

- [ ] Add/update copy and residue assertions before implementation.
- [ ] Run focused tests and confirm the expected old strings/residue are detected.
- [ ] Remove duplicate shell labels, shorten copy, fix batch-run wording, remove stale Vite residue, and reduce shell blur.
- [ ] Run focused tests and confirm they pass.

### Task 3: Feature visual consistency and accessibility

**Files:**

- Modify: `src/components/layout/page-header.tsx`
- Modify: `src/components/layout/summary-strip.tsx`
- Modify: `src/shared/components/data-table.tsx`
- Modify: `src/features/simulation_runner/chat/*`
- Modify: `src/features/simulation_runner/email/*`
- Modify: `src/features/simulation_runner/document/*`
- Modify: `src/features/history/*`
- Modify: `src/features/simulation_studio/visual-groups/*`

- [ ] Add/update layout and accessibility assertions for sort state, icon labels, compact typography, and surface rules.
- [ ] Run focused tests and confirm the assertions fail before production edits.
- [ ] Replace feature-level raw color drift with semantic tokens, remove non-semantic glow/blur, normalize labels to sentence case, and preserve status meaning.
- [ ] Run focused tests and confirm they pass.

### Task 4: Route-level performance and motion audit

**Files:**

- Modify: `src/features/documentation/documentation-page.tsx`
- Modify: `src/features/documentation/markdown.ts`
- Modify: `src/index.css`
- Modify: `vite.config.ts` only if dynamic import alone cannot split the heavy route.

- [ ] Add a focused test or static assertion proving Mermaid is not imported synchronously by the initial module path.
- [ ] Run it and confirm it fails against the current eager implementation.
- [ ] Keep Mermaid rendering functional while loading it only when documentation diagrams are present.
- [ ] Run the focused test and the full frontend suite.

### Task 5: Full verification and cleanup loop

- [x] Run `npm test`.
- [x] Run `npm run build` and inspect chunk warnings.
- [x] Run `npm run lint`; repository-wide formatting was explicitly requested and completed.
- [ ] Run `node C:\Users\User\.agents\skills\impeccable\scripts\detect.mjs --json` over changed UI targets.
- [ ] Re-scan for stale starter strings, generic error suffixes, decorative default effects, and oversized controls.
- [x] Review the final diff and confirm no backend path changed.
