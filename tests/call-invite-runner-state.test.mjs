import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCallInviteState,
  parseInviteToken,
  reduceCallInviteState,
} from '../src/features/simulation_runner/call/call-invite.ts'
import { splitMessageLinks } from '../src/features/simulation_runner/chat/utils.ts'

test('parses the invite token from the pre-join query string', () => {
  assert.equal(
    parseInviteToken('?invite=participant-1_version-1_ab12'),
    'participant-1_version-1_ab12',
  )
  assert.equal(parseInviteToken('?other=1'), null)
  assert.equal(parseInviteToken(''), null)
  assert.equal(parseInviteToken('?invite=%20'), null)
})

test('join keeps one stable event id across retries', () => {
  let state = reduceCallInviteState(initialCallInviteState, {
    type: 'invitation-loaded',
    invitationId: 'participant-1_version-1_ab12',
  })
  assert.equal(state.phase, 'invited')
  assert.equal(state.invitationId, 'participant-1_version-1_ab12')

  state = reduceCallInviteState(state, {
    type: 'join-requested',
    eventId: 'join-event-1',
    occurredAt: '2026-08-29T10:05:00.000Z',
  })
  assert.equal(state.phase, 'joining')
  assert.equal(state.eventId, 'join-event-1')

  // A retry must not replace the stored event id.
  state = reduceCallInviteState(state, {
    type: 'join-requested',
    eventId: 'join-event-2',
    occurredAt: '2026-08-29T10:05:05.000Z',
  })
  assert.equal(state.eventId, 'join-event-1')
  assert.equal(state.occurredAt, '2026-08-29T10:05:00.000Z')
})

test('join success moves to waiting-for-call until the connection resolves', () => {
  let state = reduceCallInviteState(initialCallInviteState, {
    type: 'invitation-loaded',
    invitationId: 'invite-1',
  })
  state = reduceCallInviteState(state, {
    type: 'join-requested',
    eventId: 'join-event-1',
    occurredAt: '2026-08-29T10:05:00.000Z',
  })
  state = reduceCallInviteState(state, { type: 'join-succeeded' })
  assert.equal(state.phase, 'waiting-for-call')

  state = reduceCallInviteState(state, {
    type: 'connection-resolved',
    connection: { callSessionId: 'call-session-1', roomName: 'simflow_call-session-1' },
  })
  assert.equal(state.phase, 'joined')
  assert.equal(state.connection.callSessionId, 'call-session-1')
})

test('expired invitation blocks retries without navigation', () => {
  const state = reduceCallInviteState(initialCallInviteState, {
    type: 'join-failed',
    expired: true,
  })
  assert.equal(state.phase, 'expired')
  assert.equal(state.errorMessage, null)
})

test('transient join failure returns to invited with a retryable message', () => {
  const state = reduceCallInviteState(initialCallInviteState, {
    type: 'join-failed',
    message: 'Could not join the call. Please try again.',
  })
  assert.equal(state.phase, 'invited')
  assert.equal(state.errorMessage, 'Could not join the call. Please try again.')
})

test('splits invitation chat content into clickable link segments', () => {
  const segments = splitMessageLinks(
    'Join here: https://runner.example/simulation/p1/call?invite=abc thanks',
  )
  assert.equal(segments.length, 3)
  assert.equal(segments[0].url, null)
  assert.equal(segments[1].url, 'https://runner.example/simulation/p1/call?invite=abc')
  assert.equal(segments[2].url, null)
})

test('plain chat content stays a single text segment', () => {
  const segments = splitMessageLinks('Halo, tidak ada link di sini')
  assert.equal(segments.length, 1)
  assert.equal(segments[0].url, null)
})
