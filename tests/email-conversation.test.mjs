import assert from 'node:assert/strict'
import test from 'node:test'

import { formatReplySubject, isOwnEmail } from '../src/features/simulation_runner/email/utils.ts'

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

test('formats a reply subject from the latest email subject without duplicating RE', () => {
  assert.equal(formatReplySubject('Project update'), 'RE : Project update')
  assert.equal(formatReplySubject('RE : Project update'), 'RE : Project update')
  assert.equal(formatReplySubject(''), '')
})
