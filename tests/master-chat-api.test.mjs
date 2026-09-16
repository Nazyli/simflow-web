import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createMasterChat,
  deleteMasterChat,
  getMasterChats,
  updateMasterChat,
} from '../src/shared/api/master-data.ts'
import {
  createMasterCall,
  createMasterPrompt,
  deleteMasterCall,
  deleteMasterPrompt,
  getMasterPrompts,
  updateMasterCall,
  updateMasterPrompt,
} from '../src/shared/api/master-data.ts'
import {
  createMasterEmail,
  deleteMasterEmail,
  getMasterDocumentContents,
  getMasterEmailOriginals,
  updateMasterEmail,
} from '../src/shared/api/master-data.ts'

function stubSuccess(data) {
  globalThis.fetch = async (path, init) => {
    globalThis.lastRequest = { path, init }
    return {
      ok: true,
      json: async () => ({ status: 'success', info: { code: 200, message: 'ok' }, data }),
    }
  }
}

test('loads master chats through the Studio resource endpoint', async () => {
  stubSuccess([])

  await getMasterChats()

  assert.equal(globalThis.lastRequest.path, '/admin/master-data/chats')
})

test('creates a master chat with the owning node and actor', async () => {
  stubSuccess({ chatId: 'chat-1' })

  await createMasterChat('node-1', 'actor-1', 'Hello')

  assert.equal(globalThis.lastRequest.path, '/admin/master-data/chats')
  assert.equal(globalThis.lastRequest.init.method, 'POST')
  assert.deepEqual(JSON.parse(globalThis.lastRequest.init.body), {
    nodeId: 'node-1',
    actorId: 'actor-1',
    content: 'Hello',
    prompt: null,
  })
})

test('updates a master chat without changing its chat or node identity', async () => {
  stubSuccess({ chatId: 'chat-1', nodeId: 'node-1' })

  await updateMasterChat('chat/1', 'actor-2', 'Updated')

  assert.equal(globalThis.lastRequest.path, '/admin/master-data/chats/chat%2F1')
  assert.equal(globalThis.lastRequest.init.method, 'PUT')
  assert.deepEqual(JSON.parse(globalThis.lastRequest.init.body), {
    actorId: 'actor-2',
    content: 'Updated',
    prompt: null,
  })
})

test('deletes a master chat through the hard-delete endpoint', async () => {
  stubSuccess(null)

  await deleteMasterChat('chat/1')

  assert.equal(globalThis.lastRequest.path, '/admin/master-data/chats/chat%2F1')
  assert.equal(globalThis.lastRequest.init.method, 'DELETE')
})

test('creates, updates, and deletes a node-owned master call', async () => {
  stubSuccess({ callId: 'call-1' })

  await createMasterCall('node-1', 'actor-1', 'Start call')
  assert.equal(globalThis.lastRequest.path, '/admin/master-data/calls')
  assert.deepEqual(JSON.parse(globalThis.lastRequest.init.body), {
    nodeId: 'node-1',
    actorId: 'actor-1',
    content: 'Start call',
    prompt: null,
  })

  await updateMasterCall('call/1', 'actor-2', 'Updated call')
  assert.equal(globalThis.lastRequest.path, '/admin/master-data/calls/call%2F1')
  assert.deepEqual(JSON.parse(globalThis.lastRequest.init.body), {
    actorId: 'actor-2',
    content: 'Updated call',
    prompt: null,
  })

  await deleteMasterCall('call/1')
  assert.equal(globalThis.lastRequest.path, '/admin/master-data/calls/call%2F1')
  assert.equal(globalThis.lastRequest.init.method, 'DELETE')
})

test('loads and saves master prompts for the prompt CRUD editor', async () => {
  stubSuccess([{ promptId: 'prompt-1', content: 'Classify', desc: 'Intent' }])

  await getMasterPrompts()
  assert.equal(globalThis.lastRequest.path, '/admin/master-data/prompts')

  await createMasterPrompt('node-1', 'Classify this')
  assert.deepEqual(JSON.parse(globalThis.lastRequest.init.body), {
    nodeId: 'node-1',
    content: 'Classify this',
  })

  await updateMasterPrompt('prompt/1', 'Updated')
  assert.equal(globalThis.lastRequest.path, '/admin/master-data/prompts/prompt%2F1')
  assert.deepEqual(JSON.parse(globalThis.lastRequest.init.body), {
    content: 'Updated',
  })

  await deleteMasterPrompt('prompt/1')
  assert.equal(globalThis.lastRequest.path, '/admin/master-data/prompts/prompt%2F1')
  assert.equal(globalThis.lastRequest.init.method, 'DELETE')
})

test('loads and saves node-owned master emails with parent and attachments', async () => {
  stubSuccess([{ emailId: 'email-1' }])

  await getMasterEmailOriginals('simulation/1')
  assert.equal(
    globalThis.lastRequest.path,
    '/admin/master-data/emails/originals?simulationId=simulation%2F1',
  )

  await getMasterDocumentContents()
  assert.equal(globalThis.lastRequest.path, '/admin/master-data/emails/document-contents')

  const values = {
    actorFrom: 'actor-1',
    actorTo: 'actor-2',
    actorCc: null,
    emailType: 'reply',
    parentMasterEmailId: 'parent-1',
    subject: 'Reply',
    content: 'Body',
    docContentIds: ['content-1', 'content-2'],
  }
  await createMasterEmail('node-1', values)
  assert.equal(globalThis.lastRequest.path, '/admin/master-data/emails')
  assert.deepEqual(JSON.parse(globalThis.lastRequest.init.body), { nodeId: 'node-1', ...values, prompt: null })

  await updateMasterEmail('email/1', values)
  assert.equal(globalThis.lastRequest.path, '/admin/master-data/emails/email%2F1')
  assert.deepEqual(JSON.parse(globalThis.lastRequest.init.body), { ...values, prompt: null })

  await deleteMasterEmail('email/1')
  assert.equal(globalThis.lastRequest.init.method, 'DELETE')
})
