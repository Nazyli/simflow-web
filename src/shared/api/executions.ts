import { apiClient } from './client'
import type { Execution } from '../types/workflow'

export interface ExecutionEvent { event_id: string; node_id: string | null; event_type: string; payload: Record<string, unknown>; created_at: string }
export interface NodeResult { node_result_id: string; node_id: string; status: string; result: Record<string, unknown>; created_at: string }
export const getExecutions = (workflowVersionId: string) => apiClient<Execution[]>(`/runner/executions?workflow_version_id=${encodeURIComponent(workflowVersionId)}`)
export const getExecution = (executionId: string) => apiClient<Execution>(`/runner/executions/${executionId}`)
export interface ExecutionState { execution_id: string; status: string; current_node_id: string | null; active_wait: Record<string, unknown> | null }
export const getExecutionState = (executionId: string) => apiClient<ExecutionState>(`/runner/executions/${executionId}/state`)
export const startExecution = (payload: { workflow_version_id: string; participant_id: string; context: Record<string, unknown> }) => apiClient<Execution>('/runner/executions', { method: 'POST', body: JSON.stringify(payload) })
export interface BatchExecutionRun extends Execution { outcome: 'created' | 'resumed' | 'archived' }
export interface BatchExecutionResponse { participant_id: string; runs: BatchExecutionRun[] }
export const startExecutionBatch = (payload: { participant_id: string; workflow_version_ids: string[]; context?: Record<string, unknown> }) => apiClient<BatchExecutionResponse>('/runner/executions/batch', { method: 'POST', body: JSON.stringify(payload) })
export const submitExecutionAction = (executionId: string, payload: { action_type: string; actor_id?: string; conversation_id: string; payload: Record<string, unknown> }) => apiClient<Execution>(`/runner/executions/${executionId}/actions`, { method: 'POST', body: JSON.stringify(payload) })
export const markExecutionMessageRead = (executionId: string, payload: { wait_instance_id: string; message_id: string }) => apiClient<Execution>(`/runner/executions/${executionId}/messages/read`, { method: 'POST', body: JSON.stringify(payload) })
export const completeExecution = (executionId: string) => apiClient<Execution>(`/runner/executions/${executionId}/complete`, { method: 'POST' })
export const deleteExecution = (executionId: string) => apiClient<void>(`/runner/executions/${executionId}`, { method: 'DELETE' })
export const getTimeline = (executionId: string) => apiClient<ExecutionEvent[]>(`/runner/executions/${executionId}/timeline`)
export const getNodeResults = (executionId: string) => apiClient<NodeResult[]>(`/runner/executions/${executionId}/node-results`)
