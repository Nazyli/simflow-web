import assert from 'node:assert/strict'
import test from 'node:test'

const { filterSimulationGroups, getSimulationListSummary } =
  await import('../src/features/simulation_studio/simulation-list-logic.ts')

const groups = [
  {
    groupSimulationId: 'support',
    groupSimulationName: 'Customer support',
    groupSimulationDesc: 'Triage incoming customer conversations',
    simulations: [
      {
        simulationId: 'support-v1',
        simulationName: 'Chat triage',
        channelName: 'chat',
        isLocked: true,
        executionCount: 12,
      },
      {
        simulationId: 'support-v2',
        simulationName: 'Email follow-up',
        channelName: 'email',
        isLocked: false,
      },
    ],
  },
  {
    groupSimulationId: 'onboarding',
    groupSimulationName: 'New hire onboarding',
    groupSimulationDesc: null,
    simulations: [
      {
        simulationId: 'onboarding-v1',
        simulationName: 'First week',
        channelName: 'chat',
        isLocked: false,
      },
    ],
  },
]

test('filters simulation groups across names, descriptions, versions, and channels', () => {
  assert.deepEqual(
    filterSimulationGroups(groups, 'follow-up').map((group) => group.groupSimulationId),
    ['support'],
  )
  assert.deepEqual(
    filterSimulationGroups(groups, 'CHAT').map((group) => group.groupSimulationId),
    ['support', 'onboarding'],
  )
  assert.equal(filterSimulationGroups(groups, 'missing').length, 0)
})

test('summarizes the registry without losing locked version counts', () => {
  assert.deepEqual(getSimulationListSummary(groups), {
    groups: 2,
    versions: 3,
    locked: 1,
    ready: 1,
  })
})
