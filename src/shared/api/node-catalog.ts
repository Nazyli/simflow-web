import { apiClient } from './client'
import type { NodeCatalog } from '../types/workflow'

export const getNodeCatalog = () => apiClient<NodeCatalog>('/studio/node-catalog')
