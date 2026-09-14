import assert from 'node:assert/strict'
import test from 'node:test'

import {
  projectWorkflowEdges,
  projectWorkflowNodes,
} from '../src/features/simulation_studio/visual-groups/visual-group-projection.ts'

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

test('hides grouped workflow nodes when a group is collapsed', () => {
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

  assert.equal(projected.hidden, true)
})

test('hides internal collapsed edges but keeps boundary-crossing edges visible', () => {
  const groups = [
    {
      visualGroupId: 'group-1',
      simulationId: 'sim-1',
      groupName: 'Intake',
      memberNodeIds: ['node-a', 'node-b'],
      positionX: 100,
      positionY: 200,
      width: 360,
      height: 220,
      style: { color: '#7c3aed', borderStyle: 'dashed' },
      isCollapsed: true,
    },
  ]
  const edges = [
    { edgeId: 'edge-internal', sourceNodeId: 'node-a', targetNodeId: 'node-b' },
    { edgeId: 'edge-in', sourceNodeId: 'outside', targetNodeId: 'node-a' },
    { edgeId: 'edge-out', sourceNodeId: 'node-b', targetNodeId: 'outside' },
  ]

  const projected = projectWorkflowEdges(edges, groups)

  assert.equal(projected.find((edge) => edge.edgeId === 'edge-internal').hidden, true)
  assert.equal(projected.find((edge) => edge.edgeId === 'edge-in').hidden, false)
  assert.equal(projected.find((edge) => edge.edgeId === 'edge-in').targetGroupId, 'group-1')
  assert.equal(projected.find((edge) => edge.edgeId === 'edge-in').visualTargetNodeId, 'group-1')
  assert.equal(
    projected.find((edge) => edge.edgeId === 'edge-in').visualTargetHandleId,
    'visual-group-target',
  )
  assert.equal(projected.find((edge) => edge.edgeId === 'edge-out').sourceGroupId, 'group-1')
  assert.equal(projected.find((edge) => edge.edgeId === 'edge-out').visualSourceNodeId, 'group-1')
  assert.equal(
    projected.find((edge) => edge.edgeId === 'edge-out').visualSourceHandleId,
    'visual-group-source',
  )
})
