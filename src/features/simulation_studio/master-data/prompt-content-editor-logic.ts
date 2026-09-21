export interface MarkdownInsertion {
  value: string
  selectionStart: number
  selectionEnd: number
}

export function insertMarkdownSnippet(
  value: string,
  selectionStart = value.length,
  selectionEnd = selectionStart,
  prefix: string,
  suffix: string,
  fallbackText: string,
): MarkdownInsertion {
  const start = clamp(selectionStart, 0, value.length)
  const end = clamp(Math.max(selectionEnd, start), start, value.length)
  const selectedText = value.slice(start, end) || fallbackText
  const nextValue = `${value.slice(0, start)}${prefix}${selectedText}${suffix}${value.slice(end)}`
  const nextStart = start + prefix.length

  return {
    value: nextValue,
    selectionStart: nextStart,
    selectionEnd: nextStart + selectedText.length,
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(Number.isFinite(value) ? value : maximum, minimum), maximum)
}
