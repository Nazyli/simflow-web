import { apiClient } from './client'
export const getStudioMasterData = (endpoint: string) =>
  apiClient<Record<string, unknown>[]>(endpoint)
