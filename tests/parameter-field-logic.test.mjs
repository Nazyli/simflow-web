import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildClassificationPreviewVariables,
  isNumericParameter,
  parseNumericParameter,
} from '../src/features/simulation_studio/parameter-field-logic.ts'

test('treats nullable bounded parameters as numeric inputs', () => {
  assert.equal(isNumericParameter(null, { minimum: 1, maximum: 50 }), true)
  assert.equal(parseNumericParameter('3'), 3)
  assert.equal(parseNumericParameter(''), null)
})

test('builds classification preview variables from the camelCase prompt picker name', () => {
  assert.deepEqual(
    buildClassificationPreviewVariables('ai_classification', 'promptId', {
      labels: [
        { id: 'agree-to-call', label: 'Agree to call' },
        { id: 'not-agree-to-call', label: 'Not agree to call' },
      ],
    }),
    { labels: '- Agree to call\n- Not agree to call' },
  )
})
