import assert from 'node:assert/strict'
import test from 'node:test'

import { isOwnEmail } from '../src/features/simulation_runner/email/utils.ts'

test('uses sender type to identify participant emails as own messages', () => {
  const participantEmail = {
    from: 'participant-001-ambj-01-platform',
    to: ['alexa-pmwm-ambj-01'],
    cc: [],
    actor: 'participant-001-ambj-01-platform',
    senderType: 'participant',
  }
  const actorEmail = {
    from: 'alexa-pmwm-ambj-01',
    to: ['participant-001-ambj-01-platform'],
    cc: [],
    actor: 'alexa-pmwm-ambj-01',
    senderType: 'actor',
  }

  assert.equal(isOwnEmail(participantEmail, '90722'), true)
  assert.equal(isOwnEmail(actorEmail, '90722'), false)
})
