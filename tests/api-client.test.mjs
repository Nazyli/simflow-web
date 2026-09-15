import assert from 'node:assert/strict'
import test from 'node:test'

import { eventsUrl } from '../src/shared/api/client.ts'

test('keeps the SSE participant query parameter contract in snake_case', () => {
  assert.equal(eventsUrl('participant-1'), '/web/events?participant_id=participant-1')
})
