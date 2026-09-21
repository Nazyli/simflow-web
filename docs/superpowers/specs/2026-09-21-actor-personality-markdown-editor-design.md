# Actor Personality Markdown Editor Design

## Goal

Make the Master Actors add/edit dialog support the same Markdown authoring and preview experience already used by the Prompt CRUD dialog.

## Scope

- Replace the actor personality `Textarea` with the shared `PromptContentEditor`.
- Keep the existing `personaDesc` field and API payload unchanged.
- Keep personality content stored as raw Markdown.
- Provide Markdown editing and rendered preview modes in both create and edit flows.
- Do not enable prompt placeholder highlighting or injection for actor personality.

## Design

`ActorCrudDialog` will pass `form.personaDesc` to `PromptContentEditor` and update the form through its existing `updateField` helper. The shared editor will be used without a `placeholders` prop, so its Markdown toolbar and preview are available without introducing prompt-specific placeholder behavior.

The existing `renderActorPersonality` helper and `SafeHtml` sanitizer remain responsible for rendered output elsewhere in the Actors feature. No backend, database, API contract, or actor form mapping changes are required.

## Acceptance Criteria

1. Creating an actor opens the personality field in Markdown mode with a Preview tab.
2. Editing an actor loads its existing `personaDesc` into the same editor.
3. Markdown preview renders headings, lists, emphasis, and other supported Markdown safely.
4. Switching modes does not change the underlying raw Markdown value.
5. Saving sends the same `personaDesc` string to the existing create/update API.
6. Existing actor CRUD tests and the full frontend test/build checks remain green.
