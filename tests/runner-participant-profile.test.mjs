import assert from 'node:assert/strict'
import test from 'node:test'

import { startExecutionBatch } from '../src/shared/api/executions.ts'
import {
  PARTICIPANT_GENDERS,
  PARTICIPANT_LANGUAGES,
} from '../src/features/simulation_runner/runner-participant-profile.ts'

test('runner batch sends the participant profile alongside simulation ids', async () => {
  let request
  globalThis.fetch = async (path, init) => {
    request = { path, method: init?.method, body: JSON.parse(String(init?.body)) }
    return {
      ok: true,
      json: async () => ({
        status: 'success',
        info: { code: 200, message: 'ok' },
        data: { participantId: 'participant-1', runs: [] },
      }),
    }
  }

  await startExecutionBatch({
    participantId: 'participant-1',
    simulationIds: ['simulation-1'],
    participantFullName: 'Budi Santoso',
    participantGender: 'Female',
    participantLanguage: 'Bahasa Inggris',
    participantActorId: 'actor-1',
  })

  assert.equal(request.path, '/web/executions/batch')
  assert.equal(request.method, 'POST')
  assert.deepEqual(request.body, {
    participantId: 'participant-1',
    simulationIds: ['simulation-1'],
    participantFullName: 'Budi Santoso',
    participantGender: 'Female',
    participantLanguage: 'Bahasa Inggris',
    participantActorId: 'actor-1',
  })
})

test('runner exposes exactly the supported gender and language choices', () => {
  assert.deepEqual(PARTICIPANT_GENDERS, ['Male', 'Female'])
  assert.deepEqual(PARTICIPANT_LANGUAGES, ['Bahasa Indonesia', 'Bahasa Inggris'])
})
