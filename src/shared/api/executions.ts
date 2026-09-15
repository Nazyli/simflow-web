import { apiClient } from './client'
import type { Execution } from '../types/simulation'

export interface NodeExecution {
  nodeExecutionId: string
  nodeId: string
  status: string
  selectedPort: string | null
  selectedEdgeId: string | null
  sequenceNumber: number
  outputData: Record<string, unknown> | null
}
export interface ExecutionTrace {
  eventId: string
  nodeId: string
  eventType: string
  payload: Record<string, unknown>
  createdAt: string
}
export const getExecutions = (simulationId: string) =>
  apiClient<Execution[]>(`/web/executions?simulationId=${encodeURIComponent(simulationId)}`)
export const getParticipantExecutions = (participantId: string) =>
  apiClient<Execution[]>(
    `/web/sessions/executions?participantId=${encodeURIComponent(participantId)}`,
  )
export interface BatchExecutionRun extends Execution {
  outcome: 'created' | 'resumed' | 'archived'
}
export interface BatchExecutionResponse {
  participantId: string
  runs: BatchExecutionRun[]
}
export const startExecutionBatch = (payload: {
  participantId: string
  simulationIds: string[]
  context?: Record<string, unknown>
}) =>
  apiClient<BatchExecutionResponse>('/web/executions/batch', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const deleteExecution = (executionId: string) =>
  apiClient<void>(`/web/executions/${executionId}`, { method: 'DELETE' })
export const getNodeExecutions = (executionId: string) =>
  apiClient<NodeExecution[]>(`/web/executions/${executionId}/node-executions`)
export const getExecutionTrace = async (executionId: string): Promise<ExecutionTrace[]> =>
  (await getNodeExecutions(executionId)).map((item) => ({
    eventId: item.nodeExecutionId,
    nodeId: item.nodeId,
    eventType: item.status,
    payload: {
      selectedPort: item.selectedPort,
      selectedEdgeId: item.selectedEdgeId,
      outputData: item.outputData,
    },
    createdAt: '',
  }))
