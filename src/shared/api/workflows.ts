import { apiClient } from './client'
import type { Workflow } from '../types/workflow'

export const getWorkflows = () => apiClient<Workflow[]>('/workflows')
