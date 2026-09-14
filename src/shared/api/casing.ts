type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

function toCamel(key: string): string {
  return key.replace(/_([a-zA-Z0-9])/g, (_match, character: string) => character.toUpperCase())
}

function toSnake(key: string): string {
  return key
    .replace(/([A-Z])/g, (_match, character: string) => `_${character.toLowerCase()}`)
    .replace(/^_/, '')
}

export function camelizeJson<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => camelizeJson(item)) as T
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [toCamel(key), camelizeJson(item)]),
    ) as T
  }
  return value
}

export function snakeizeJson<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => snakeizeJson(item)) as T
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [toSnake(key), snakeizeJson(item)]),
    ) as T
  }
  return value
}

export type { JsonValue }
