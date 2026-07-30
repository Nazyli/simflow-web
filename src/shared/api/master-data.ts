import { apiClient } from './client'
export const getMasterData = (resource: string) => apiClient<Record<string, unknown>[]>(`/master/${resource}`)
export const updateMasterData = (resource: string, recordId: string, values: Record<string, unknown>) => apiClient<void>(`/master/${resource}/${recordId}`, { method: 'PUT', body: JSON.stringify({ values }) })
