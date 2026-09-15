import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { markEmailAttachmentOpened, sendParticipantEmail } from '../src/shared/api/email.ts'
import { sortAttachmentPreviewPages } from '../src/features/simulation_runner/email/types.ts'
import { getStudioMasterEmail } from '../src/shared/api/master-data.ts'

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
    'simulation-1',
    undefined,
    undefined,
    'root-email-1',
    'direct-reply-email-2',
  )

  assert.equal(request.path, '/web/email?participantId=participant%201')
  assert.deepEqual(JSON.parse(request.init.body), {
    partnerId: 'actor-1',
    subject: 'Re: Contract',
    content: 'Please review the revision.',
    simulationId: 'simulation-1',
    to: [],
    cc: [],
    parentEmailId: 'root-email-1',
    replyToEmailId: 'direct-reply-email-2',
  })
})

test('records a runtime attachment open against its participant email scope', async () => {
  let request
  globalThis.fetch = async (path, init) => {
    request = { path, init }
    return {
      ok: true,
      json: async () => ({ status: 'success', info: { code: 200, message: 'ok' }, data: {} }),
    }
  }

  await markEmailAttachmentOpened(
    'runtime attachment/1',
    'participant 1',
    'simulation 1',
    'participant email/1',
  )

  assert.equal(
    request.path,
    '/web/email/attachments/runtime%20attachment%2F1/opened?participantId=participant+1&simulationId=simulation+1&participantEmailId=participant+email%2F1',
  )
  assert.equal(request.init.method, 'POST')
})

test('opens a runtime email attachment by email_attachment_id', async () => {
  let request
  globalThis.fetch = async (path, init) => {
    request = { path, init }
    return {
      ok: true,
      json: async () => ({ status: 'success', info: { code: 200, message: 'ok' }, data: {} }),
    }
  }

  await markEmailAttachmentOpened(
    'runtime attachment/1',
    'participant 1',
    'simulation 1',
    'participant email/1',
  )

  assert.match(request.path, /attachments\/runtime%20attachment%2F1\/opened/)
})

test('declares the runtime attachment snapshot response contract', async () => {
  const source = await readFile(new URL('../src/shared/api/email.ts', import.meta.url), 'utf8')

  assert.match(source, /emailAttachmentId: string/)
  assert.match(source, /contents: RuntimeEmailAttachmentContent\[\]/)
  assert.doesNotMatch(source, /^\s*attachment_id: string$/m)
})

test('sorts attachment preview pages in ascending page order', () => {
  const pages = sortAttachmentPreviewPages([
    {
      participantAttachmentEmailId: 'page-2',
      emailAttachmentId: 'runtime-1',
      participantDocContentId: null,
      page: 2,
      content: 'Second page',
      isHighlight: false,
      ownerName: 'actor-1',
    },
    {
      participantAttachmentEmailId: 'page-1',
      emailAttachmentId: 'runtime-1',
      participantDocContentId: null,
      page: 1,
      content: 'First page',
      isHighlight: false,
      ownerName: 'actor-1',
    },
  ])

  assert.deepEqual(
    pages.map((page) => page.participantAttachmentEmailId),
    ['page-1', 'page-2'],
  )
})

test('loads the selected source email detail for an attachment picker', async () => {
  let request
  globalThis.fetch = async (path, init) => {
    request = { path, init }
    return {
      ok: true,
      json: async () => ({ status: 'success', info: { code: 200, message: 'ok' }, data: {} }),
    }
  }

  await getStudioMasterEmail('WELCOME EMAIL/1')

  assert.equal(request.path, '/admin/master-data/emails/WELCOME%20EMAIL%2F1')
  assert.deepEqual(request.init, { headers: { 'Content-Type': 'application/json' } })
})
