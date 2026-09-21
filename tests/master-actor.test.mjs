import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  actorFormFromRecord,
  emptyActorForm,
  hasActorPersonality,
  renderActorPersonality,
  validateActorForm,
} from '../src/features/master_data/actor-crud-logic.ts'
import {
  createMasterActor,
  deleteMasterActor,
  updateMasterActor,
} from '../src/shared/api/master-data.ts'
import { masterDataNavigation } from '../src/app/layouts/navigation.ts'

const actorDialogSource = readFileSync(
  new URL('../src/features/master_data/actor-crud-dialog.tsx', import.meta.url),
  'utf8',
)

function stubSuccess(data) {
  globalThis.fetch = async (path, init) => {
    globalThis.lastRequest = { path, init }
    return {
      ok: true,
      json: async () => ({ status: 'success', info: { code: 200, message: 'ok' }, data }),
    }
  }
}

test('maps an actor record into the edit form and keeps optional nulls empty', () => {
  assert.deepEqual(
    actorFormFromRecord({
      actorId: 'actor-1',
      actorName: 'Risa',
      actorEmail: null,
      actorPosition: 'Coach',
      actorGroupPosition: null,
      personaDesc: '# Warm',
      isParticipant: true,
    }),
    {
      actorId: 'actor-1',
      actorName: 'Risa',
      actorEmail: '',
      actorPosition: 'Coach',
      actorGroupPosition: '',
      personaDesc: '# Warm',
      isParticipant: true,
    },
  )
})

test('validates actor id only for a new actor and validates name always', () => {
  assert.equal(validateActorForm(emptyActorForm(), false), 'Enter an actor ID.')
  assert.equal(
    validateActorForm({ ...emptyActorForm(), actorId: 'actor-1' }, false),
    'Enter a name.',
  )
  assert.equal(validateActorForm({ ...emptyActorForm(), actorName: 'Risa' }, true), null)
})

test('creates an actor with camelCase payload and null optional blanks', async () => {
  stubSuccess({ actorId: 'actor-1' })

  await createMasterActor({
    actorId: 'actor-1',
    actorName: 'Risa',
    actorEmail: '',
    actorPosition: '',
    actorGroupPosition: '',
    personaDesc: '# Warm',
    isParticipant: false,
  })

  assert.equal(globalThis.lastRequest.path, '/admin/master-data/actors')
  assert.equal(globalThis.lastRequest.init.method, 'POST')
  assert.deepEqual(JSON.parse(globalThis.lastRequest.init.body), {
    actorId: 'actor-1',
    actorName: 'Risa',
    actorEmail: null,
    actorPosition: null,
    actorGroupPosition: null,
    personaDesc: '# Warm',
    isParticipant: false,
  })
})

test('updates an actor without sending actor id in the body', async () => {
  stubSuccess({ actorId: 'actor-1' })

  await updateMasterActor('actor/1', {
    actorId: 'actor-1',
    actorName: 'Updated',
    actorEmail: 'updated@example.test',
    actorPosition: 'Coach',
    actorGroupPosition: 'People',
    personaDesc: '# Updated',
    isParticipant: true,
  })

  assert.equal(globalThis.lastRequest.path, '/admin/master-data/actors/actor%2F1')
  assert.equal(globalThis.lastRequest.init.method, 'PUT')
  assert.deepEqual(JSON.parse(globalThis.lastRequest.init.body), {
    actorName: 'Updated',
    actorEmail: 'updated@example.test',
    actorPosition: 'Coach',
    actorGroupPosition: 'People',
    personaDesc: '# Updated',
    isParticipant: true,
  })
})

test('deletes an actor through the soft-delete endpoint', async () => {
  stubSuccess(null)

  await deleteMasterActor('actor/1')

  assert.equal(globalThis.lastRequest.path, '/admin/master-data/actors/actor%2F1')
  assert.equal(globalThis.lastRequest.init.method, 'DELETE')
})

test('renders actor personality Markdown as headings and list markup', () => {
  const html = renderActorPersonality('# Warm\n- Clear\n- Concise')

  assert.match(html, /<h1>Warm<\/h1>/)
  assert.match(html, /<ul><li>Clear<\/li><li>Concise<\/li><\/ul>/)
})

test('escapes unsafe actor personality HTML', () => {
  const html = renderActorPersonality('<script>alert(1)</script>')

  assert.doesNotMatch(html, /<script>/)
})

test('only offers the personality preview for non-empty personality content', () => {
  assert.equal(hasActorPersonality('# Warm'), true)
  assert.equal(hasActorPersonality('  '), false)
  assert.equal(hasActorPersonality(null), false)
})

test('uses the shared Markdown editor for actor personality', () => {
  assert.match(actorDialogSource, /PromptContentEditor/)
  assert.match(actorDialogSource, /id="master-actor-personality"/)
  assert.match(actorDialogSource, /value=\{form\.personaDesc\}/)
  assert.doesNotMatch(actorDialogSource, /<Textarea/)
})

test('exposes Actors under the Master Data navigation group', () => {
  assert.equal(masterDataNavigation.label, 'Master Data')
  assert.equal(masterDataNavigation.path, '/master-data')
  assert.deepEqual(masterDataNavigation.children, [
    { label: 'Actors', path: '/master-data/actors' },
  ])
})
