import assert from 'node:assert/strict'
import test from 'node:test'

import {
  emailDialogInitialForm,
  emptyEmailForm,
  toggleEmailAttachment,
  validateEmailForm,
} from '../src/features/simulation_studio/master-data/email-crud-logic.ts'

test('starts a new original email form without parent or attachments', () => {
  assert.deepEqual(emptyEmailForm(), {
    actorFrom: '',
    actorTo: '',
    actorCc: '',
    emailType: 'original',
    parentMasterEmailId: '',
    subject: '',
    content: '',
    docContentIds: [],
    prompt: '',
  })
})

test('maps an existing reply email and its document contents', () => {
  const records = [
    {
      emailId: 'email-1',
      emailName: 'Reply',
      nodeId: 'node-1',
      actorFrom: 'actor-1',
      actorTo: 'actor-2',
      actorCc: null,
      emailType: 'reply',
      parentMasterEmailId: 'email-original',
      subject: 'Reply',
      content: 'Body',
      attachments: [
        { attachmentId: 'attachment-1', docContentId: 'content-1', documentId: 'doc-1', documentName: 'Policy' },
      ],
    },
  ]
  assert.deepEqual(emailDialogInitialForm('email-1', records), {
    actorFrom: 'actor-1',
    actorTo: 'actor-2',
    actorCc: '',
    emailType: 'reply',
    parentMasterEmailId: 'email-original',
    subject: 'Reply',
    content: 'Body',
    docContentIds: ['content-1'],
    prompt: '',
  })
})

test('validates reply parent and supports multiple document contents', () => {
  const values = { ...emptyEmailForm(), actorFrom: 'actor-1', actorTo: 'actor-2', subject: 'Subject', content: 'Body', emailType: 'reply' }
  assert.equal(validateEmailForm(values), 'Select the original email for this reply.')
  assert.equal(validateEmailForm({ ...values, parentMasterEmailId: 'email-original' }), null)
  assert.deepEqual(toggleEmailAttachment(['content-1'], 'content-2', true), ['content-1', 'content-2'])
  assert.deepEqual(toggleEmailAttachment(['content-1', 'content-2'], 'content-1', false), ['content-2'])
})
