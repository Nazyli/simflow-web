export interface PlaceholderInsertion {
  value: string
  caret: number
}

export type TemplateTokenKind = 'text' | 'valid' | 'invalid'

export interface TemplateToken {
  text: string
  kind: TemplateTokenKind
}

export interface PlaceholderRange {
  start: number
  end: number
}

export function insertTemplatePlaceholder(
  value: string,
  name: string,
  selectionStart = value.length,
  selectionEnd = selectionStart,
): PlaceholderInsertion {
  const token = `{${name}}`
  const start = clamp(selectionStart, 0, value.length)
  const end = clamp(Math.max(selectionEnd, start), start, value.length)
  const nextValue = `${value.slice(0, start)}${token}${value.slice(end)}`
  return { value: nextValue, caret: start + token.length }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(Number.isFinite(value) ? value : maximum, minimum), maximum)
}

export function tokenizeTemplate(value: string, allowedNames: Iterable<string>): TemplateToken[] {
  const allowed = new Set(allowedNames)
  const tokens: TemplateToken[] = []
  const placeholderPattern = /\{[^{}]*\}/g
  let cursor = 0

  for (const match of value.matchAll(placeholderPattern)) {
    const start = match.index ?? cursor
    if (start > cursor) tokens.push({ text: value.slice(cursor, start), kind: 'text' })
    const text = match[0]
    const name = text.slice(1, -1)
    tokens.push({ text, kind: allowed.has(name) ? 'valid' : 'invalid' })
    cursor = start + text.length
  }
  if (cursor < value.length) tokens.push({ text: value.slice(cursor), kind: 'text' })
  return tokens
}

export function placeholderRangeForDeletion(
  value: string,
  cursor: number,
  key: 'Backspace' | 'Delete',
): PlaceholderRange | undefined {
  const position = clamp(cursor, 0, value.length)
  const placeholderPattern = /\{[^{}]*\}/g
  for (const match of value.matchAll(placeholderPattern)) {
    const start = match.index ?? 0
    const end = start + match[0].length
    if (
      (key === 'Backspace' && position > start && position <= end) ||
      (key === 'Delete' && position >= start && position < end)
    ) {
      return { start, end }
    }
  }
  return undefined
}
