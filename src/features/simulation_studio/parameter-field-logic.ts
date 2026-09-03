import type { ParameterOption, ParameterPicker } from '../../shared/types/simulation'

export function resolveParameterMultiline(
  name: string,
  parameterOptions?: Record<string, ParameterOption>,
): boolean {
  return Boolean(parameterOptions?.[name]?.multiline)
}

export function isPickerAppendOne(picker: ParameterPicker): boolean {
  return picker.value_type === 'array' && picker.selection_mode === 'append_one'
}

export function pickerAddButtonLabel(label: string): string {
  return `Add ${label}`
}

export function pickerSelectButtonLabel(label: string): string {
  return `Pick ${label}`
}
