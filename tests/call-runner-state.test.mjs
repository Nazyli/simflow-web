import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyCallStatus,
  initialCallRunnerState,
  makeParticipantEndRequest,
  reduceCallRunnerState,
} from '../src/features/simulation_runner/call/call-lifecycle.ts'

function activeConnection() {
  return {
    callSessionId: 'call-session-1',
    serverUrl: 'wss://livekit.example',
    roomName: 'simflow_call-session-1',
    participantToken: 'participant-token',
    participantName: 'Participant One',
    participantIdentity: 'participant-1',
    actorId: 'actor-1',
    actorLevel: 'Manager',
    mode: 'agent_driven',
    status: 'active',
  }
}

test('transient LiveKit disconnect retains connection and history for reconnect', () => {
  let state = reduceCallRunnerState(initialCallRunnerState, {
    type: 'connection-resolved',
    connection: activeConnection(),
  })
  state = reduceCallRunnerState(state, { type: 'reconnecting' })

  assert.equal(state.phase, 'reconnecting')
  assert.equal(state.connection?.callSessionId, 'call-session-1')

  state = reduceCallRunnerState(state, {
    type: 'disconnected',
    recheck: { ...activeConnection(), status: 'active' },
  })

  assert.equal(state.phase, 'awaiting-reconnect')
  assert.equal(state.navigateTo, null)
  assert.equal(state.connection?.callSessionId, 'call-session-1')
  assert.equal(state.reconnectToken, 'participant-token')
})

test('explicit participant end keeps a stable event id across retry then clears after success', () => {
  let state = reduceCallRunnerState(initialCallRunnerState, {
    type: 'participant-end-requested',
    eventId: 'participant-end-1',
    occurredAt: '2026-08-28T10:00:00.000Z',
  })
  assert.equal(state.eventId, 'participant-end-1')
  assert.equal(state.pendingEnd, true)

  state = reduceCallRunnerState(state, { type: 'participant-end-failed' })
  assert.equal(state.eventId, 'participant-end-1')
  assert.equal(state.cleared, false)

  state = reduceCallRunnerState(state, { type: 'participant-end-succeeded' })
  assert.equal(state.cleared, true)
  assert.equal(state.navigateTo, 'simulation')
})

test('terminal provider state navigates out of the call', () => {
  const byConnection = reduceCallRunnerState(initialCallRunnerState, {
    type: 'connection-resolved',
    connection: { ...activeConnection(), status: 'ended' },
  })
  assert.equal(byConnection.phase, 'ended')
  assert.equal(byConnection.navigateTo, 'simulation')

  const byDisconnect = reduceCallRunnerState(initialCallRunnerState, {
    type: 'disconnected',
    recheck: { ...activeConnection(), status: 'failed' },
  })
  assert.equal(byDisconnect.navigateTo, 'simulation')
})

test('classifies call statuses and builds the participant end request body', () => {
  assert.equal(classifyCallStatus('active'), 'active')
  assert.equal(classifyCallStatus('reconnecting'), 'reconnecting')
  assert.equal(classifyCallStatus('ended'), 'terminal')
  assert.equal(classifyCallStatus('disconnected'), 'terminal')
  assert.equal(classifyCallStatus('unknown'), 'absent')
  assert.equal(classifyCallStatus(null), 'absent')

  assert.deepEqual(
    makeParticipantEndRequest(
      'call-session-1',
      'participant-1',
      'participant-end-1',
      '2026-08-28T10:00:00.123Z',
    ),
    {
      participantId: 'participant-1',
      eventId: 'participant-end-1',
      occurredAt: '2026-08-28T10:00:00.123Z',
    },
  )
})
