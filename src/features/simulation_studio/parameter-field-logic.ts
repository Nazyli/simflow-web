import type { ParameterOption } from '../../shared/types/simulation'

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
  return (
    typeof validationRule.minimum === 'number' || typeof validationRule.maximum === 'number'
  )
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

export function pickerAddButtonLabel(label: string): string {
  return `Add ${label}`
}

export function pickerSelectButtonLabel(label: string): string {
  return `Pick ${label}`
}
