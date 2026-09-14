import assert from 'node:assert/strict'
import test from 'node:test'

import {
  absoluteToParentPosition,
  parentToAbsolutePosition,
  pointOnRectBoundary,
  shouldDetachChild,
  translateGroupMembers,
} from '../src/features/simulation_studio/visual-groups/visual-group-layout.ts'

test('converts absolute node position to parent-relative and back', () => {
  const parent = { x: 100, y: 200, width: 400, height: 240 }
  const absolute = { x: 140, y: 260 }

  const relative = absoluteToParentPosition(absolute, parent)

  assert.deepEqual(relative, { x: 40, y: 60 })
  assert.deepEqual(parentToAbsolutePosition(relative, parent), absolute)
})

test('translates only the members of a visual group', () => {
  const nodes = [
    { id: 'child-a', parentId: 'group-1', position: { x: 10, y: 20 } },
    { id: 'child-b', parentId: 'group-1', position: { x: 40, y: 50 } },
    { id: 'outside', position: { x: 100, y: 100 } },
  ]

  const translated = translateGroupMembers(nodes, 'group-1', { x: 30, y: -10 })

  assert.deepEqual(translated[0].position, { x: 40, y: 10 })
  assert.deepEqual(translated[1].position, { x: 70, y: 40 })
  assert.deepEqual(translated[2].position, { x: 100, y: 100 })
})

test('detaches a child when its center is outside the group bounds', () => {
  const group = { x: 100, y: 200, width: 400, height: 240 }

  assert.equal(shouldDetachChild({ x: 20, y: 40, width: 100, height: 80 }, group), true)
  assert.equal(shouldDetachChild({ x: 200, y: 260, width: 100, height: 80 }, group), false)
})

test('projects an external edge endpoint onto the nearest group boundary', () => {
  const boundary = pointOnRectBoundary(
    { x: 100, y: 200, width: 400, height: 240 },
    { x: 20, y: 320 },
  )

  assert.deepEqual(boundary, { x: 100, y: 320, position: 'left' })
})
