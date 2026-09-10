import assert from 'node:assert/strict'
import test from 'node:test'

import {
  pickerAddButtonLabel,
  resolveParameterMultiline,
} from '../src/features/simulation_studio/parameter-field-logic.ts'
import {
  applyPickerSelection,
  isPickerAppendOne,
  removePickerValue,
} from '../src/features/simulation_studio/pickers/picker-logic.ts'

test('generic multiline true resolves to a textarea render decision', () => {
  const parameterOptions = { body: { multiline: true } }
  assert.equal(resolveParameterMultiline('body', parameterOptions), true)
  assert.equal(resolveParameterMultiline('body', undefined), false)
  assert.equal(resolveParameterMultiline('subject', { subject: {} }), false)
})

test('knowledge-sources array picker appends and removes values generically', () => {
  const picker = {
    resource: 'knowledge-sources',
    value_field: 'id',
    display_fields: ['label', 'context_label'],
    value_type: 'array',
    selection_mode: 'append_one',
  }
  assert.equal(isPickerAppendOne(picker), true)

  const first = applyPickerSelection([], { id: 'general_condition_company' }, picker)
  assert.deepEqual(first, ['general_condition_company'])

  const second = applyPickerSelection(first, { id: 'general_condition_mella' }, picker)
  assert.deepEqual(second, ['general_condition_company', 'general_condition_mella'])

  assert.deepEqual(
    applyPickerSelection(second, { id: 'general_condition_company' }, picker),
    second,
  )

  assert.deepEqual(removePickerValue(second, 'general_condition_company'), [
    'general_condition_mella',
  ])
})

test('append_one picker button says Add, never Pick document', () => {
  const label = pickerAddButtonLabel('Knowledge Sources')
  assert.equal(label.includes('Add'), true)
  assert.equal(label.includes('Pick document'), false)
})
