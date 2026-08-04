const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

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
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  const body = await response.json() as SuccessResponse<T> | ErrorResponse
  if (!response.ok) throw new ApiError(JSON.stringify(body), response.status)
  return (body as SuccessResponse<T>).data
}

export function eventsUrl(participantId: string): string {
  return `${apiBaseUrl}/runner/events?participant_id=${encodeURIComponent(participantId)}`
}
