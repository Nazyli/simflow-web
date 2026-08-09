import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getParticipantExecutions } from '../../shared/api/executions'
import { type PublishedWorkflowVersion } from '../../shared/api/workflows'
import type { Execution } from '../../shared/types/workflow'

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
  const activeWorkflow =
    (client.getQueryData<PublishedWorkflowVersion[]>(['published-versions']) ?? []).find(
      (item) => item.workflow_version_id === activeExecution?.workflow_version_id,
    ) ?? null
  return { runs, activeExecution, activeWorkflow }
}
