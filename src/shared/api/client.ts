const viteEnv = (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env
const apiBaseUrl = viteEnv ? (viteEnv.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1') : ''

import { camelizeJson, snakeizeJson } from './casing'

interface ApiInfo {
  code: number
  message: string
}

interface SuccessResponse<T> {
  status: 'success'
  info: ApiInfo
  data: T
}

interface ErrorResponse {
  status: 'error'
  info: ApiInfo
  data: null
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  const requestInit: RequestInit = { ...init }
  if (typeof init.body === 'string' && init.body.length > 0) {
    try {
      requestInit.body = JSON.stringify(camelizeJson(JSON.parse(init.body)))
    } catch {
      requestInit.body = init.body
    }
  }
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestInit,
    headers: { 'Content-Type': 'application/json', ...requestInit.headers },
  })
  const body = (await response.json()) as SuccessResponse<T> | ErrorResponse
  if (!response.ok) throw new ApiError(JSON.stringify(body), response.status)
  return snakeizeJson((body as SuccessResponse<T>).data)
}

export function eventsUrl(participantId: string): string {
  return `${apiBaseUrl}/runner/events?participant_id=${encodeURIComponent(participantId)}`
}
