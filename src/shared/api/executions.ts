import { apiClient } from './client'
import type { Execution } from '../types/workflow'

export interface NodeExecution {
  node_execution_id: string
  node_id: string
  status: string
  selected_port: string | null
  selected_edge_id: string | null
  sequence_number: number
  output_data: Record<string, unknown> | null
}
export interface ExecutionTrace {
  event_id: string
  node_id: string
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}
export const getExecutions = (workflowVersionId: string) =>
  apiClient<Execution[]>(
    `/runner/executions?workflow_version_id=${encodeURIComponent(workflowVersionId)}`,
  )
export const getParticipantExecutions = (participantId: string) =>
  apiClient<Execution[]>(
    `/runner/sessions/executions?participant_id=${encodeURIComponent(participantId)}`,
  )
export interface BatchExecutionRun extends Execution {
  outcome: 'created' | 'resumed' | 'archived'
}
export interface BatchExecutionResponse {
  participant_id: string
  runs: BatchExecutionRun[]
}
export const startExecutionBatch = (payload: {
  participant_id: string
  workflow_version_ids: string[]
  context?: Record<string, unknown>
}) =>
  apiClient<BatchExecutionResponse>('/runner/executions/batch', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const submitExecutionAction = (
  executionId: string,
  payload: { action_type: string; actor_id?: string; payload: Record<string, unknown> },
) =>
  apiClient<Execution>(`/runner/executions/${executionId}/actions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const deleteExecution = (executionId: string) =>
  apiClient<void>(`/runner/executions/${executionId}`, { method: 'DELETE' })
export const getNodeExecutions = (executionId: string) =>
  apiClient<NodeExecution[]>(`/runner/executions/${executionId}/node-executions`)
export const getExecutionTrace = async (executionId: string): Promise<ExecutionTrace[]> =>
  (await getNodeExecutions(executionId)).map((item) => ({
    event_id: item.node_execution_id,
    node_id: item.node_id,
    event_type: item.status,
    payload: {
      selected_port: item.selected_port,
      selected_edge_id: item.selected_edge_id,
      output_data: item.output_data,
    },
    created_at: '',
  }))
