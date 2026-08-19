import assert from 'node:assert/strict'
import test from 'node:test'

import { NodeAutosaveQueue } from '../src/features/simulation_studio/node-autosave.ts'

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

test('persists only the newest queued payload for a node', async () => {
  const saved = []
  const queue = new NodeAutosaveQueue({
    delayMs: 10,
    save: async (_nodeId, payload) => saved.push(payload),
  })

  queue.enqueue('node-1', { rotation: 90 })
  queue.enqueue('node-1', { rotation: 180 })

  await sleep(25)

  assert.deepEqual(saved, [{ rotation: 180 }])
})

test('waits for an in-flight save before persisting a later change', async () => {
  const saved = []
  let resolveFirstSave
  const firstSave = new Promise((resolve) => {
    resolveFirstSave = resolve
  })
  const queue = new NodeAutosaveQueue({
    delayMs: 5,
    save: async (_nodeId, payload) => {
      saved.push(payload)
      if (saved.length === 1) await firstSave
    },
  })

  queue.enqueue('node-1', { rotation: 90 })
  await sleep(15)
  queue.enqueue('node-1', { rotation: 180 })
  await sleep(15)

  assert.deepEqual(saved, [{ rotation: 90 }])

  resolveFirstSave()
  await sleep(15)

  assert.deepEqual(saved, [{ rotation: 90 }, { rotation: 180 }])
})
