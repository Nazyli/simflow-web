import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isNumericParameter,
  parseNumericParameter,
} from '../src/features/simulation_studio/parameter-field-logic.ts'

test('treats nullable bounded parameters as numeric inputs', () => {
  assert.equal(isNumericParameter(null, { minimum: 1, maximum: 50 }), true)
  assert.equal(parseNumericParameter('3'), 3)
  assert.equal(parseNumericParameter(''), null)
})
