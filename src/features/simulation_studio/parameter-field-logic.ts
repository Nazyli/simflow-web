import type { ParameterOption } from '../../shared/types/simulation'

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
