import { apiClient } from './client'
import type { Workflow } from '../types/workflow'
import type { WorkflowVersion } from '../types/workflow'

export const getWorkflows = () => apiClient<Workflow[]>('/workflows')
export const createWorkflow = (payload: Pick<Workflow, 'workflow_name' | 'workflow_desc' | 'workspace_id'>) => apiClient<Workflow>('/workflows', { method: 'POST', body: JSON.stringify(payload) })
export const createVersion = (workflowId: string) => apiClient<WorkflowVersion>(`/workflows/${workflowId}/versions`, { method: 'POST' })
export const publishVersion = (versionId: string) => apiClient<WorkflowVersion>(`/workflows/versions/${versionId}/publish`, { method: 'POST' })
