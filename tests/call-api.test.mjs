import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCallConnection,
  getCallHistory,
  requestCallJoin,
  requestParticipantEnd,
} from '../src/shared/api/agent-call.ts'

test('requests the active call connection for a participant', async () => {
  const requests = []
  globalThis.fetch = async (path, init) => {
    requests.push({ path, method: init?.method ?? 'GET' })
    return {
      ok: true,
      json: async () => ({
        status: 'success',
        info: { code: 200, message: 'ok' },
        data: {
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
        },
      }),
    }
  }

  const details = await getCallConnection('participant-1')

  assert.equal(requests[0].path, '/agent-call/connection?participant_id=participant-1')
  assert.equal(details.callSessionId, 'call-session-1')
  assert.equal(details.roomName, 'simflow_call-session-1')
})

test('loads call history by session and participant', async () => {
  const requests = []
  globalThis.fetch = async (path, init) => {
    requests.push({ path, method: init?.method ?? 'GET' })
    return {
      ok: true,
      json: async () => ({ status: 'success', info: { code: 200, message: 'ok' }, data: [] }),
    }
  }

  await getCallHistory('call-session-1', 'participant-1')

  assert.equal(
    requests[0].path,
    '/agent-call/sessions/call-session-1/history?participant_id=participant-1',
  )
})

test('posts a stable participant end request', async () => {
  const requests = []
  globalThis.fetch = async (path, init) => {
    requests.push({
      path,
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    })
    return {
      ok: true,
      json: async () => ({
        status: 'success',
        info: { code: 200, message: 'ok' },
        data: {
          callSessionId: 'call-session-1',
          status: 'ended',
          eventId: 'participant-end-1',
          endedAt: '2026-08-28T10:00:01.000Z',
          reason: 'participant_requested',
        },
      }),
    }
  }

  await requestParticipantEnd(
    'call-session-1',
    'participant-1',
    'participant-end-1',
    '2026-08-28T10:00:00.123Z',
  )

  assert.equal(requests[0].path, '/agent-call/sessions/call-session-1/participant-end')
  assert.equal(requests[0].method, 'POST')
  assert.deepEqual(requests[0].body, {
    participant_id: 'participant-1',
    event_id: 'participant-end-1',
    occurred_at: '2026-08-28T10:00:00.123Z',
  })
})

test('posts a stable call invitation join request', async () => {
  const requests = []
  globalThis.fetch = async (path, init) => {
    requests.push({
      path,
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    })
    return {
      ok: true,
      json: async () => ({
        status: 'success',
        info: { code: 200, message: 'ok' },
        data: {
          invitation_id: 'participant-1_version-1_ab12',
          participant_id: 'participant-1',
          execution_id: 'execution-1',
          node_execution_id: 'node-execution-1',
          status: 'joined',
        },
      }),
    }
  }

  const result = await requestCallJoin(
    'participant-1',
    'participant-1_version-1_ab12',
    'join-event-1',
    '2026-08-29T10:05:00.123Z',
  )

  assert.equal(requests[0].path, '/runner/call/join')
  assert.equal(requests[0].method, 'POST')
  assert.deepEqual(requests[0].body, {
    participant_id: 'participant-1',
    invitation_id: 'participant-1_version-1_ab12',
    event_id: 'join-event-1',
    occurred_at: '2026-08-29T10:05:00.123Z',
  })
  assert.equal(result.status, 'joined')
})
