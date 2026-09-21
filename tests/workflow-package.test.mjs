import assert from 'node:assert/strict'
import test from 'node:test'

import { buildWorkflowExportFileName } from '../src/features/simulation_studio/workflow-package-logic.ts'

const exportDate = new Date(2026, 8, 21, 18, 31, 32)

test('builds a timestamped workflow export filename from the simulation name', () => {
  assert.equal(
    buildWorkflowExportFileName('Coaching Simulation v1', exportDate),
    'Coaching-Simulation-v1-20260921-183132.json',
  )
})

test('uses the timestamped fallback when a simulation name has no safe characters', () => {
  assert.equal(
    buildWorkflowExportFileName('***', exportDate),
    'simflow-workflow-20260921-183132.json',
  )
})
