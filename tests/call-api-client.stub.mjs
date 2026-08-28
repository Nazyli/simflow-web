export async function apiClient(path, init) {
  const response = await globalThis.fetch(path, init)
  const body = await response.json()
  if (!response.ok) throw new Error(JSON.stringify(body))
  return body.data
}
