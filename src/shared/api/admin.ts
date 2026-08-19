import { apiClient } from './client'

export interface ResetResponse {
  status: string
  downgrade: string
  upgrade: string
  seed: string
}

export async function resetDatabase(): Promise<ResetResponse> {
  return apiClient<ResetResponse>('/admin/reset', { method: 'POST' })
}
