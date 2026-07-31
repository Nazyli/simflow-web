import { apiRootClient } from './client'
import type { NodeCatalog } from '../types/workflow'

export const getNodeCatalog = () => apiRootClient<NodeCatalog>('/node-catalog')
