import { apiClient } from './client'
import type { NodeCatalog } from '../types/simulation'

export const getNodeCatalog = () => apiClient<NodeCatalog>('/studio/node-catalog')
