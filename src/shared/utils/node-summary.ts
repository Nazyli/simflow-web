export function deriveNodeSummary(parameters: Record<string, unknown>): string | null {
  if (!parameters || typeof parameters !== 'object') return null
  for (const [, value] of Object.entries(parameters)) {
    if (value == null) continue
    if (typeof value === 'string') {
      const t = value.trim()
      if (t) return t.length > 48 ? `${t.slice(0, 48)}…` : t
    }
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    if (Array.isArray(value) && value.length > 0) {
      const parts = value
        .map((item) => {
          if (typeof item === 'string') return item.trim()
          if (typeof item === 'number' && Number.isFinite(item)) return String(item)
          if (item && typeof item === 'object') {
            const record = item as Record<string, unknown>
            for (const key of ['label', 'name', 'id']) {
              const field = record[key]
              if (typeof field === 'string' && field.trim()) return field.trim()
            }
          }
          return ''
        })
        .filter(Boolean)
      if (parts.length > 0) {
        const joined = parts.join(', ')
        return joined.length > 48 ? `${joined.slice(0, 48)}…` : joined
      }
      return `${value.length} item${value.length > 1 ? 's' : ''}`
    }
  }
  return null
}
