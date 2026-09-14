import assert from 'node:assert/strict'
import test from 'node:test'

import { camelizeJson, snakeizeJson } from '../src/shared/api/casing.ts'

test('camelizes nested request JSON without changing values', () => {
  assert.deepEqual(
    camelizeJson({
      node_type: 'wait_for_reply',
      parameters: { enable_timeout: true, timeout_seconds: 600 },
      labels: [{ actor_id: 'actor_1', label: 'Keep actor_1 as a value' }],
    }),
    {
      nodeType: 'wait_for_reply',
      parameters: { enableTimeout: true, timeoutSeconds: 600 },
      labels: [{ actorId: 'actor_1', label: 'Keep actor_1 as a value' }],
    },
  )
})

test('snakeizes nested response JSON for existing frontend models', () => {
  assert.deepEqual(
    snakeizeJson({
      nodeType: 'wait_for_reply',
      outputPorts: [{ dataSchema: {}, dataType: 'object' }],
      context: { lastParticipantReply: 'setuju' },
    }),
    {
      node_type: 'wait_for_reply',
      output_ports: [{ data_schema: {}, data_type: 'object' }],
      context: { last_participant_reply: 'setuju' },
    },
  )
})
