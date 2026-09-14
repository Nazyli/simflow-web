import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getParticipantExecutions } from '../../shared/api/executions'
import { type PublishedSimulation } from '../../shared/api/simulations'
import type { Execution } from '../../shared/types/simulation'

export function useParticipantRuns(participantId: string, options?: { enabled?: boolean }) {
  const client = useQueryClient()
  const enabled = options?.enabled ?? true
  const runsQuery = useQuery({
    queryKey: ['participant-executions', participantId],
    queryFn: () => getParticipantExecutions(participantId),
    enabled: enabled && Boolean(participantId.trim()),
  })
  const runs = enabled ? (runsQuery.data ?? []) : []
  const activeExecution: Execution | null =
    runs.find((run) => run.status === 'waiting' || run.status === 'running') ?? runs[0] ?? null
  const activeSimulation =
    (client.getQueryData<PublishedSimulation[]>(['published-simulations']) ?? []).find(
      (item) => item.simulationId === activeExecution?.simulationId,
    ) ?? null
  return { runs, activeExecution, activeSimulation }
}
