import { apiClient } from './client'
export const getMasterData = (resource: string) => apiClient<Record<string, unknown>[]>(`/master/${resource}`)
