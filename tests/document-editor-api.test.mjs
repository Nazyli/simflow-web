import assert from 'node:assert/strict'
import test from 'node:test'

import { createDocument, updateDocument } from '../src/shared/api/documents.ts'

test('createDocument posts camelCase document pages to the participant endpoint', async () => {
  let request
  globalThis.fetch = async (path, init) => {
    request = { path, init }
    return {
      ok: true,
      json: async () => ({ status: 'success', info: { code: 200, message: 'created' }, data: {} }),
    }
  }

  await createDocument('participant 1', {
    documentName: 'Guide',
    contents: [{ page: 1, content: '<p>One</p>' }],
  })

  assert.equal(request.path, '/web/documents?participantId=participant%201')
  assert.equal(request.init.method, 'POST')
  assert.deepEqual(JSON.parse(request.init.body), {
    documentName: 'Guide',
    contents: [{ page: 1, content: '<p>One</p>' }],
  })
})

test('updateDocument puts the full page set for the selected runtime document', async () => {
  let request
  globalThis.fetch = async (path, init) => {
    request = { path, init }
    return {
      ok: true,
      json: async () => ({ status: 'success', info: { code: 200, message: 'updated' }, data: {} }),
    }
  }

  await updateDocument('participant/1', 'document/2', {
    documentName: 'Updated Guide',
    contents: [
      { page: 1, content: '<p>One</p>' },
      { page: 2, content: '<p>Two</p>' },
    ],
  })

  assert.equal(
    request.path,
    '/web/documents/document%2F2?participantId=participant%2F1',
  )
  assert.equal(request.init.method, 'PUT')
  assert.deepEqual(JSON.parse(request.init.body).contents, [
    { page: 1, content: '<p>One</p>' },
    { page: 2, content: '<p>Two</p>' },
  ])
})
