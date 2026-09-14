import assert from 'node:assert/strict'
import test from 'node:test'

import { buildConversations } from '../src/features/simulation_runner/chat/utils.ts'

test('groups both directions into the selected actor conversation', () => {
  const conversations = buildConversations(
    [
      {
        messageId: 'participant-message',
        from: '90722',
        to: 'alexa-pmwm-ambj-01',
        actor: '90722',
        senderType: 'participant',
        channel: 'chat',
        chatId: null,
        content: 'Halo Pak De',
        timestamp: '2026-09-14T03:53:49',
        actionType: 'message',
      },
      {
        messageId: 'actor-message',
        from: 'alexa-pmwm-ambj-01',
        to: 'alexa-pmwm-ambj-01',
        actor: 'alexa-pmwm-ambj-01',
        senderType: 'actor',
        channel: 'chat',
        chatId: null,
        content: 'Selamat siang Pak Nazyli',
        timestamp: '2026-09-14T03:53:53',
        actionType: 'message',
      },
    ],
    { 'alexa-pmwm-ambj-01': 'Alexa' },
    '90722',
  )

  assert.equal(conversations.length, 1)
  assert.equal(conversations[0].actor, 'alexa-pmwm-ambj-01')
  assert.equal(conversations[0].messages.length, 2)
})
