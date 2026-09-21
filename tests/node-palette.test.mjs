import assert from 'node:assert/strict'
import test from 'node:test'

import { buildNodePaletteGroups } from '../src/features/simulation_studio/node-palette.ts'

const definition = (nodeType, label, paletteGroups, parameters = {}, paletteParameters = {}) => ({
  nodeType,
  category: 'action',
  label,
  icon: 'circle',
  color: '#000000',
  description: '',
  inputPorts: [],
  outputPorts: [],
  parameters,
  validationRules: {},
  paletteGroups,
  paletteParameters,
})

test('builds visible palette groups from backend metadata and omits empty groups', () => {
  const groups = buildNodePaletteGroups({
    paletteGroups: [
      { id: 'chat', label: 'Chat' },
      { id: 'email', label: 'Email' },
      { id: 'documents', label: 'Dokumen' },
    ],
    categories: [],
    nodes: [
      definition('send_chat', 'Send Chat', ['chat']),
      definition(
        'wait_for_reply',
        'Wait for Reply',
        ['chat', 'email'],
        { channel: 'chat' },
        {
          chat: { channel: 'chat' },
          email: { channel: 'email' },
        },
      ),
    ],
  })

  assert.deepEqual(
    groups.map((group) => group.id),
    ['chat', 'email'],
  )
  assert.deepEqual(
    groups[0].entries.map((entry) => entry.definition.nodeType),
    ['send_chat', 'wait_for_reply'],
  )
  assert.deepEqual(groups[1].entries[0].parameters, { channel: 'email' })
})
