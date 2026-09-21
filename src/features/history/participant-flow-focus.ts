type ParticipantExecution = {
  nodeId: string
  sequenceNumber: number | null
}

export function selectParticipantFocusNodeId(
  currentState: string | null,
  executions: ParticipantExecution[],
  availableNodeIds: ReadonlySet<string>,
): string | null {
  if (currentState && availableNodeIds.has(currentState)) return currentState

  return (
    [...executions]
      .sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0))
      .reverse()
      .find((execution) => availableNodeIds.has(execution.nodeId))?.nodeId ?? null
  )
}
