import { apiClient } from './client'
export const getMasterData = (resource: string) =>
  apiClient<Record<string, unknown>[]>(`/master-data/${resource}`)
export const getStudioMasterData = (endpoint: string) =>
  apiClient<Record<string, unknown>[]>(endpoint)
export const updateMasterData = (
  resource: string,
  recordId: string,
  values: Record<string, unknown>,
) =>
  apiClient<void>(`/master-data/${resource}/${recordId}`, {
    method: 'PUT',
    body: JSON.stringify({ values }),
  })
export const createMasterData = (resource: string, values: Record<string, unknown>) =>
  apiClient<void>(`/master-data/${resource}`, { method: 'POST', body: JSON.stringify({ values }) })
export const deleteMasterData = (resource: string, recordId: string) =>
  apiClient<void>(`/master-data/${resource}/${recordId}`, { method: 'DELETE' })
