import assert from 'node:assert/strict'
import test from 'node:test'

import { sendParticipantEmail } from '../src/shared/api/email.ts'

test('serializes the selected root and direct reply email IDs for a participant email', async () => {
  let request
  globalThis.fetch = async (path, init) => {
    request = { path, init }
    return {
      ok: true,
      json: async () => ({ status: 'success', info: { code: 200, message: 'ok' }, data: {} }),
    }
  }

  await sendParticipantEmail(
    'participant 1',
    'actor-1',
    'Re: Contract',
    'Please review the revision.',
    'workflow-1',
    undefined,
    undefined,
    'root-email-1',
    'direct-reply-email-2',
  )

  assert.equal(request.path, '/runner/email?participant_id=participant%201')
  assert.deepEqual(JSON.parse(request.init.body), {
    partner_id: 'actor-1',
    subject: 'Re: Contract',
    content: 'Please review the revision.',
    workflow_version_id: 'workflow-1',
    to: [],
    cc: [],
    parent_email_id: 'root-email-1',
    reply_to_email_id: 'direct-reply-email-2',
  })
})
