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
    'workflow-1',
    undefined,
    undefined,
    'root-email-1',
    'direct-reply-email-2',
  )

  assert.equal(request.path, '/runner/email?participant_id=participant%201')
  assert.deepEqual(JSON.parse(request.init.body), {
    partner_id: 'actor-1',
    subject: 'Re: Contract',
    content: 'Please review the revision.',
    workflow_version_id: 'workflow-1',
    to: [],
    cc: [],
    parent_email_id: 'root-email-1',
    reply_to_email_id: 'direct-reply-email-2',
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
    'workflow 1',
    'participant email/1',
  )

  assert.equal(
    request.path,
    '/runner/email/attachments/runtime%20attachment%2F1/opened?participant_id=participant+1&workflow_version_id=workflow+1&participant_email_id=participant+email%2F1',
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
    'workflow 1',
    'participant email/1',
  )

  assert.match(request.path, /attachments\/runtime%20attachment%2F1\/opened/)
})

test('declares the runtime attachment snapshot response contract', async () => {
  const source = await readFile(new URL('../src/shared/api/email.ts', import.meta.url), 'utf8')

  assert.match(source, /email_attachment_id: string/)
  assert.match(source, /contents: RuntimeEmailAttachmentContent\[\]/)
  assert.doesNotMatch(source, /^\s*attachment_id: string$/m)
})

test('sorts attachment preview pages in ascending page order', () => {
  const pages = sortAttachmentPreviewPages([
    {
      participant_attachment_email_id: 'page-2',
      email_attachment_id: 'runtime-1',
      participant_doc_content_id: null,
      page: 2,
      content: 'Second page',
      is_highlight: false,
      owner_name: 'actor-1',
    },
    {
      participant_attachment_email_id: 'page-1',
      email_attachment_id: 'runtime-1',
      participant_doc_content_id: null,
      page: 1,
      content: 'First page',
      is_highlight: false,
      owner_name: 'actor-1',
    },
  ])

  assert.deepEqual(
    pages.map((page) => page.participant_attachment_email_id),
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

  assert.equal(request.path, '/studio/master-data/emails/WELCOME%20EMAIL%2F1')
  assert.equal(request.init, undefined)
})
