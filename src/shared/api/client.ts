const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

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
  if (!response.ok) throw new ApiError(await response.text() || 'API request failed.', response.status)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function apiRootClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  const rootUrl = apiBaseUrl.replace(/\/v1$/, '')
  const response = await fetch(`${rootUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } })
  if (!response.ok) throw new ApiError(await response.text() || 'API request failed.', response.status)
  return response.json() as Promise<T>
}
