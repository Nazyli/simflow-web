import type { GroupSimulation } from '../../shared/types/simulation'

function searchableText(group: GroupSimulation): string {
  return [
    group.groupSimulationName,
    group.groupSimulationDesc,
    ...(group.simulations ?? []).flatMap((simulation) => [
      simulation.simulationName,
      simulation.channelName,
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
}

export function filterSimulationGroups(
  groups: GroupSimulation[],
  query: string,
): GroupSimulation[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return groups
  return groups.filter((group) => searchableText(group).includes(normalizedQuery))
}

export function getSimulationListSummary(groups: GroupSimulation[]) {
  const simulations = groups.flatMap((group) => group.simulations ?? [])
  const locked = simulations.filter((simulation) => simulation.isLocked).length
  return {
    groups: groups.length,
    versions: simulations.length,
    locked,
    ready: groups.filter(
      (group) => !(group.simulations ?? []).some((simulation) => simulation.isLocked),
    ).length,
  }
}
