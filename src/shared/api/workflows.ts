import { apiClient } from './client'
import type { InputPort, OutputPort, Workflow } from '../types/workflow'
import type { WorkflowVersion } from '../types/workflow'

export const getWorkflows = () => apiClient<Workflow[]>('/workflows')
export const createWorkflow = (payload: Pick<Workflow, 'workflow_name' | 'workflow_desc' | 'workspace_id'>) => apiClient<Workflow>('/workflows', { method: 'POST', body: JSON.stringify(payload) })
export const updateWorkflow = (workflowId: string, payload: Pick<Workflow, 'workflow_name' | 'workflow_desc' | 'workspace_id'>) => apiClient<Workflow>(`/workflows/${workflowId}`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteWorkflow = (workflowId: string) => apiClient<void>(`/workflows/${workflowId}`, { method: 'DELETE' })
export const createVersion = (workflowId: string) => apiClient<WorkflowVersion>(`/workflows/${workflowId}/versions`, { method: 'POST' })
export const createDraftFromVersion = (versionId: string) => apiClient<WorkflowVersion>(`/workflows/versions/${versionId}/draft`, { method: 'POST' })
export const getWorkflowVersions = (workflowId: string) => apiClient<WorkflowVersion[]>(`/workflows/${workflowId}/versions`)
export interface PublishedWorkflowVersion extends WorkflowVersion { workflow_name: string; is_active: boolean }
export const getPublishedVersions = () => apiClient<PublishedWorkflowVersion[]>('/workflows/versions/published')
export const getWorkflowVersion = (versionId: string) => apiClient<WorkflowVersion & { workflow_name: string }>(`/workflows/versions/${versionId}`)
export const publishVersion = (versionId: string) => apiClient<WorkflowVersion>(`/workflows/versions/${versionId}/publish`, { method: 'POST' })
export interface ApiNode { node_id: string; node_name: string; node_type: string; parameters: Record<string, unknown>; position_x: number | null; position_y: number | null; category: string; input_ports: InputPort[]; output_ports: OutputPort[] }
export interface ApiEdge { edge_id: string; source_node_id: string; source_port_id: string; target_node_id: string; target_port_id: string; priority: number; is_valid: boolean }
export type ApiNodePayload = Omit<ApiNode, 'node_id' | 'category' | 'input_ports' | 'output_ports'>
export type ApiEdgePayload = Omit<ApiEdge, 'edge_id' | 'is_valid'>
export const getGraph = (versionId: string) => apiClient<[ApiNode[], ApiEdge[]]>(`/workflows/versions/${versionId}/graph`)
export const addNode = (versionId: string, payload: ApiNodePayload) => apiClient<ApiNode>(`/workflows/versions/${versionId}/nodes`, { method: 'POST', body: JSON.stringify(payload) })
export const updateNode = (nodeId: string, payload: ApiNodePayload) => apiClient<ApiNode>(`/workflows/nodes/${nodeId}`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteNode = (nodeId: string) => apiClient<void>(`/workflows/nodes/${nodeId}`, { method: 'DELETE' })
export const addWorkflowEdge = (versionId: string, payload: ApiEdgePayload) => apiClient<ApiEdge>(`/workflows/versions/${versionId}/edges`, { method: 'POST', body: JSON.stringify(payload) })
export const updateWorkflowEdge = (edgeId: string, payload: ApiEdgePayload) => apiClient<ApiEdge>(`/workflows/edges/${edgeId}`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteWorkflowEdge = (edgeId: string) => apiClient<void>(`/workflows/edges/${edgeId}`, { method: 'DELETE' })
