import type { ParameterPicker } from '../../../shared/types/simulation'

export function applyPickerSelection(
  currentValues: string[],
  record: Record<string, unknown>,
  picker: ParameterPicker,
): string[] {
  const raw = record[picker.valueField]
  const next = raw === null || raw === undefined ? '' : String(raw)
  if (!next) return currentValues
  if (isPickerAppendOne(picker)) {
    return currentValues.includes(next) ? currentValues : [...currentValues, next]
  }
  return [next]
}

export function isPickerAppendOne(picker: ParameterPicker): boolean {
  return picker.valueType === 'array' && picker.selectionMode === 'append_one'
}

export function removePickerValue(currentValues: string[], value: string): string[] {
  return currentValues.filter((candidate) => candidate !== value)
}
