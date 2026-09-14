import assert from 'node:assert/strict'
import test from 'node:test'

import { projectWorkflowNodes } from '../src/features/simulation_studio/visual-groups/visual-group-projection.ts'

test('projects grouped workflow nodes under visual group nodes without changing graph edges', () => {
  const groups = [
    {
      visualGroupId: 'group-1',
      simulationId: 'sim-1',
      groupName: 'Intake',
      memberNodeIds: ['node-a'],
      positionX: 100,
      positionY: 200,
      width: 360,
      height: 220,
      style: { color: '#7c3aed', borderStyle: 'dashed' },
      isCollapsed: false,
    },
  ]
  const workflowNodes = [
    { id: 'node-a', position: { x: 140, y: 260 }, type: 'simulation' },
    { id: 'node-b', position: { x: 700, y: 260 }, type: 'simulation' },
  ]

  const projected = projectWorkflowNodes(workflowNodes, groups)

  assert.equal(projected[0].parentId, 'group-1')
  assert.deepEqual(projected[0].position, { x: 40, y: 60 })
  assert.equal(projected[1].parentId, undefined)
  assert.deepEqual(projected[1].position, { x: 700, y: 260 })
})

test('keeps grouped workflow nodes visible when a group is collapsed', () => {
  const collapsedGroup = {
    visualGroupId: 'group-1',
    simulationId: 'sim-1',
    groupName: 'Intake',
    memberNodeIds: ['node-a'],
    positionX: 100,
    positionY: 200,
    width: 360,
    height: 220,
    style: { color: '#7c3aed', borderStyle: 'dashed' },
    isCollapsed: true,
  }

  const [projected] = projectWorkflowNodes(
    [{ id: 'node-a', position: { x: 140, y: 260 }, type: 'simulation' }],
    [collapsedGroup],
  )

  assert.notEqual(projected.hidden, true)
})
