import assert from 'node:assert/strict'
import test from 'node:test'

import { selectParticipantFocusNodeId } from '../src/features/history/participant-flow-focus.ts'

const availableNodeIds = new Set(['start', 'send-chat', 'end'])

test('prefers the current participant node when it exists in the graph', () => {
  const nodeId = selectParticipantFocusNodeId(
    'send-chat',
    [
      { nodeId: 'start', sequenceNumber: 1 },
      { nodeId: 'send-chat', sequenceNumber: 2 },
    ],
    availableNodeIds,
  )

  assert.equal(nodeId, 'send-chat')
})

test('focuses the last mapped participant execution when current state is absent', () => {
  const nodeId = selectParticipantFocusNodeId(
    null,
    [
      { nodeId: 'start', sequenceNumber: 1 },
      { nodeId: 'send-chat', sequenceNumber: 2 },
      { nodeId: 'end', sequenceNumber: 3 },
    ],
    availableNodeIds,
  )

  assert.equal(nodeId, 'end')
})

test('skips an external last execution and uses the latest node in the graph', () => {
  const nodeId = selectParticipantFocusNodeId(
    null,
    [
      { nodeId: 'send-chat', sequenceNumber: 2 },
      { nodeId: 'external-wait', sequenceNumber: 3 },
    ],
    availableNodeIds,
  )

  assert.equal(nodeId, 'send-chat')
})
