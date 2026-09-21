import type { ParameterOption, ParameterPicker } from '../../shared/types/simulation'

type ValidationRule = Record<string, unknown>

export function isNumericParameter(
  defaultValue: unknown,
  validationRule?: ValidationRule,
): boolean {
  if (typeof defaultValue === 'number') return true
  if (!validationRule) return false

  const type = validationRule.type
  if (type === 'number' || type === 'integer') return true
  if (Array.isArray(type) && type.some((item) => item === 'number' || item === 'integer'))
    return true
  return typeof validationRule.minimum === 'number' || typeof validationRule.maximum === 'number'
}

export function parseNumericParameter(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function resolveParameterMultiline(
  name: string,
  parameterOptions?: Record<string, ParameterOption>,
): boolean {
  return Boolean(parameterOptions?.[name]?.multiline)
}

export function buildClassificationPreviewVariables(
  nodeType: string,
  parameterName: string,
  configuration: Record<string, unknown>,
): Record<string, string> | undefined {
  if (nodeType !== 'ai_classification' || !['promptId', 'prompt_id'].includes(parameterName)) {
    return undefined
  }
  if (!Array.isArray(configuration.labels)) return undefined

  const labels = configuration.labels
    .map((item) => {
      if (!item || typeof item !== 'object') return ''
      const candidate = item as { id?: unknown; label?: unknown }
      const label = typeof candidate.label === 'string' ? candidate.label.trim() : ''
      if (label) return label
      return typeof candidate.id === 'string' ? candidate.id.trim() : ''
    })
    .filter(Boolean)
  return labels.length ? { labels: labels.map((label) => `- ${label}`).join('\n') } : undefined
}

export function isChatCrudEditor(picker: Pick<ParameterPicker, 'editor'> | undefined): boolean {
  return picker?.editor === 'chat_crud'
}

export function isCrudEditor(picker: Pick<ParameterPicker, 'editor'> | undefined): boolean {
  return (
    picker?.editor === 'chat_crud' ||
    picker?.editor === 'call_crud' ||
    picker?.editor === 'prompt_crud' ||
    picker?.editor === 'email_crud'
  )
}

export function pickerAddButtonLabel(label: string): string {
  return `Add ${label}`
}

export function pickerSelectButtonLabel(label: string): string {
  return `Pick ${label}`
}
