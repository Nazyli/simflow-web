# Actor Personality Markdown Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reuse the Prompt CRUD Markdown editor in the Master Actors add/edit dialog.

**Architecture:** Keep actor form state and the existing `personaDesc` API contract unchanged. Replace only the personality field UI with the shared `PromptContentEditor`, without passing prompt placeholder metadata.

**Tech Stack:** React, TypeScript, shared `PromptContentEditor`, node:test, tsx, Prettier, Oxlint, Vite.

**Spec:** `docs/superpowers/specs/2026-09-21-actor-personality-markdown-editor-design.md`

## Global Constraints

- Personality is stored and submitted as raw Markdown.
- No backend, database, or API contract changes.
- Do not enable prompt placeholder behavior for actor personality.
- Preserve existing actor CRUD behavior and shared Markdown sanitization.

## Review Focus

- Existing actor content must load into the editor in edit mode; the current actor mapping test remains the regression check.
- Empty personality content must remain valid and preview as the existing empty state; the actor form validation and full suite cover this path.
- Switching to Preview must render Markdown rather than expose raw HTML; the shared renderer and existing personality rendering tests cover this path.
- Save payloads must preserve raw Markdown; existing create/update API payload tests cover this path.

### Task 1: Reuse shared Markdown editor in Actor CRUD

**Files:**
- Modify: `src/features/master_data/actor-crud-dialog.tsx`
- Test: `tests/master-actor.test.mjs`

**Interfaces:**
- Consumes: `PromptContentEditor` props `{ id, value, disabled, onValueChange }`.
- Produces: Actor add/edit dialog with Markdown and Preview modes bound to `form.personaDesc`.

- [ ] **Step 1: Write the failing regression test**

  Add a source-level contract test that asserts the actor dialog imports `PromptContentEditor`, renders it for `master-actor-personality`, and does not pass a `placeholders` prop.

- [ ] **Step 2: Run the focused test and verify it fails**

  Run: `npx tsx --test tests/master-actor.test.mjs`

  Expected: FAIL because the actor dialog still uses `Textarea` for personality.

- [ ] **Step 3: Replace the actor personality field with the shared editor**

  Import `PromptContentEditor`, remove the actor dialog's `Textarea` import if unused, and replace the personality field with:

  ```tsx
  <PromptContentEditor
    id="master-actor-personality"
    disabled={busy}
    value={form.personaDesc}
    onValueChange={(value) => updateField('personaDesc', value)}
  />
  ```

  Keep the existing label and helper text, and omit `placeholders` so personality remains independent from prompt placeholder behavior.

- [ ] **Step 4: Run focused tests and verify they pass**

  Run: `npx tsx --test tests/master-actor.test.mjs`

  Expected: all actor tests pass, including the new editor contract test.

- [ ] **Step 5: Format and validate the changed files**

  Run: `npx prettier --write src/features/master_data/actor-crud-dialog.tsx tests/master-actor.test.mjs` and `npx oxlint src/features/master_data/actor-crud-dialog.tsx`.

  Expected: formatting completes and Oxlint reports no diagnostics.

- [ ] **Step 6: Run the full frontend verification**

  Run: `npm test` and `npm run build`.

  Expected: all frontend tests pass and the production build completes successfully.

- [ ] **Step 7: Commit the implementation**

  ```bash
  git add src/features/master_data/actor-crud-dialog.tsx tests/master-actor.test.mjs
  git commit -m "feat: add markdown editor to actor personality"
  ```
