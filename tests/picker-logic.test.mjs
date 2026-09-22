import assert from 'node:assert/strict'
import test from 'node:test'
import { applyPickerSelection } from '../src/features/simulation_studio/pickers/picker-logic.ts'

test('appends actor picker selections to reply_targets without adding a to field', () => {
  const picker = {
    resource: 'actors',
    valueField: 'actorId',
    displayFields: ['actorId', 'actorName'],
    endpoint: '/admin/master-data/actors',
    valueType: 'array',
    selectionMode: 'append_one',
  }
  let configuration = { replyTargets: [] }

  configuration = {
    ...configuration,
    replyTargets: applyPickerSelection(configuration.replyTargets, { actorId: 'actor-a' }, picker),
  }
  configuration = {
    ...configuration,
    replyTargets: applyPickerSelection(configuration.replyTargets, { actorId: 'actor-b' }, picker),
  }

  assert.deepEqual(configuration.replyTargets, ['actor-a', 'actor-b'])
  assert.equal(Object.hasOwn(configuration, 'to'), false)
})
