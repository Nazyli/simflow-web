import assert from 'node:assert/strict'
import test from 'node:test'

import { previewPrompt } from '../src/shared/api/master-data.ts'

test('previewPrompt sends node type and prompt to the backend preview endpoint', async () => {
  let request
  globalThis.fetch = async (path, init) => {
    request = { path, init }
    return {
      ok: true,
      json: async () => ({
        status: 'success',
        info: { code: 200, message: 'ok' },
        data: {
          renderedPrompt: 'Hello Nazyli',
          variables: {},
          unresolvedPlaceholders: [],
        },
      }),
    }
  }

  await previewPrompt('send_chat', 'Hello {user_name}')

  assert.equal(request.path, '/admin/master-data/prompts/preview')
  assert.equal(request.init.method, 'POST')
  assert.deepEqual(JSON.parse(request.init.body), {
    nodeType: 'send_chat',
    prompt: 'Hello {user_name}',
  })
})

test('previewPrompt sends the selected actor when one is provided', async () => {
  let request
  globalThis.fetch = async (path, init) => {
    request = { path, init }
    return {
      ok: true,
      json: async () => ({
        status: 'success',
        info: { code: 200, message: 'ok' },
        data: { renderedPrompt: 'Hello Rina', variables: {}, unresolvedPlaceholders: [] },
      }),
    }
  }

  await previewPrompt('send_email', 'Hello {actor_name}', 'actor-1')

  assert.equal(request.path, '/admin/master-data/prompts/preview')
  assert.deepEqual(JSON.parse(request.init.body), {
    nodeType: 'send_email',
    prompt: 'Hello {actor_name}',
    actorId: 'actor-1',
  })
})

test('previewPrompt sends modal data as preview variables', async () => {
  let request
  globalThis.fetch = async (path, init) => {
    request = { path, init }
    return {
      ok: true,
      json: async () => ({
        status: 'success',
        info: { code: 200, message: 'ok' },
        data: { renderedPrompt: 'Pesan: Isi chat', variables: {}, unresolvedPlaceholders: [] },
      }),
    }
  }

  await previewPrompt('send_chat', 'Pesan: {message_template}', null, {
    message_template: 'Isi chat',
  })

  assert.deepEqual(JSON.parse(request.init.body), {
    nodeType: 'send_chat',
    prompt: 'Pesan: {message_template}',
    variables: { message_template: 'Isi chat' },
  })
})
