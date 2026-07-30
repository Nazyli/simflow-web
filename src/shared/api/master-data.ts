import { apiClient } from './client'
export const getMasterData = (resource: string) => apiClient<Record<string, unknown>[]>(`/master/${resource}`)
export const updateMasterData = (resource: string, recordId: string, values: Record<string, unknown>) => apiClient<void>(`/master/${resource}/${recordId}`, { method: 'PUT', body: JSON.stringify({ values }) })
export const createMasterData = (resource: string, values: Record<string, unknown>) => apiClient<void>(`/master/${resource}`, { method: 'POST', body: JSON.stringify({ values }) })
export const deleteMasterData = (resource: string, recordId: string) => apiClient<void>(`/master/${resource}/${recordId}`, { method: 'DELETE' })
