import assert from 'node:assert/strict'
import test from 'node:test'

import {
  attachVisualGroupMember,
  cleanupVisualGroups,
  createVisualGroup,
  detachVisualGroupMember,
  ungroupVisualGroup,
} from '../src/features/simulation_studio/visual-groups/visual-group-actions.ts'

const nodes = [
  { id: 'node-a', position: { x: 100, y: 200 }, measured: { width: 220, height: 90 } },
  { id: 'node-b', position: { x: 380, y: 260 }, measured: { width: 200, height: 90 } },
  { id: 'node-c', position: { x: 900, y: 900 }, measured: { width: 200, height: 90 } },
]

test('creates a padded visual group around selected nodes', () => {
  const group = createVisualGroup(nodes, ['node-a', 'node-b'], { simulationId: 'sim-1' })

  assert.equal(group.simulationId, 'sim-1')
  assert.equal(group.groupName, 'New group')
  assert.deepEqual(group.memberNodeIds, ['node-a', 'node-b'])
  assert.deepEqual({ x: group.positionX, y: group.positionY }, { x: 68, y: 168 })
  assert.deepEqual({ width: group.width, height: group.height }, { width: 544, height: 246 })
})

test('detaches members and removes a group when it becomes empty', () => {
  const group = {
    visualGroupId: 'group-1',
    simulationId: 'sim-1',
    groupName: 'Flow',
    memberNodeIds: ['node-a', 'node-b'],
    positionX: 0,
    positionY: 0,
    width: 400,
    height: 200,
    style: { color: '#7c3aed', borderStyle: 'dashed' },
    isCollapsed: false,
  }

  const remaining = detachVisualGroupMember(group, 'node-a')
  assert.deepEqual(remaining?.memberNodeIds, ['node-b'])
  assert.equal(detachVisualGroupMember(remaining, 'node-b'), null)
})

test('attaches a node to an existing group and removes stale membership elsewhere', () => {
  const groups = [
    { visualGroupId: 'group-1', memberNodeIds: ['node-a'] },
    { visualGroupId: 'group-2', memberNodeIds: ['node-b'] },
  ]

  assert.deepEqual(attachVisualGroupMember(groups, 'group-1', 'node-b'), [
    { visualGroupId: 'group-1', memberNodeIds: ['node-a', 'node-b'] },
  ])
})

test('ungroups without deleting workflow nodes', () => {
  const groups = [
    { visualGroupId: 'group-1', memberNodeIds: ['node-a'] },
    { visualGroupId: 'group-2', memberNodeIds: ['node-b'] },
  ]

  assert.deepEqual(ungroupVisualGroup(groups, 'group-1'), [groups[1]])
})

test('cleans deleted node IDs and removes empty groups', () => {
  const groups = [
    { visualGroupId: 'group-1', memberNodeIds: ['node-a', 'gone'] },
    { visualGroupId: 'group-2', memberNodeIds: ['gone'] },
  ]

  assert.deepEqual(cleanupVisualGroups(groups, new Set(['gone'])), [
    { visualGroupId: 'group-1', memberNodeIds: ['node-a'] },
  ])
})
