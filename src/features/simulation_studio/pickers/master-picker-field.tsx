import { PackageSearch, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import type { ParameterPicker } from '../../../shared/types/workflow'
import { applyPickerSelection, isPickerAppendOne, removePickerValue } from './picker-logic'
import { pickerAddButtonLabel, pickerSelectButtonLabel } from '../parameter-field-logic'
import { MasterPickerDialog } from './master-picker-dialog'

export function MasterPickerField({
  label,
  value,
  required = false,
  multiline = false,
  picker,
  filterValue,
  onChange,
}: {
  label: string
  value: unknown
  required?: boolean
  multiline?: boolean
  picker: ParameterPicker
  filterValue?: string
  onChange: (value: string | string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const filter =
    picker.filter_by && picker.filter_field && filterValue
      ? { field: picker.filter_field, value: filterValue }
      : undefined
  const values = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
  const isAppendOne = isPickerAppendOne(picker)
  const select = (record: Record<string, unknown>) => {
    onChange(
      isAppendOne
        ? applyPickerSelection(values, record, picker)
        : record[picker.value_field] === null || record[picker.value_field] === undefined
          ? ''
          : String(record[picker.value_field]),
    )
  }
  return (
    <div className="grid gap-1.5">
      <Label className="capitalize">{label}</Label>
      {isAppendOne ? (
        <div className="grid gap-2">
          <div className="space-y-2">
            {values.map((item, index) => (
              <div key={item} className="flex gap-2">
                <Input readOnly aria-label={`${label} ${index + 1}`} value={item} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${item}`}
                  onClick={() => onChange(removePickerValue(values, item))}
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            <PackageSearch /> {pickerAddButtonLabel(label)}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          {multiline ? (
            <Textarea
              className="flex-1"
              required={required}
              value={String(value ?? '')}
              onChange={(event) => onChange(event.target.value)}
            />
          ) : (
            <Input
              className="flex-1"
              required={required}
              value={String(value ?? '')}
              onChange={(event) => onChange(event.target.value)}
            />
          )}
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            <PackageSearch /> {pickerSelectButtonLabel(label)}
          </Button>
        </div>
      )}
      <MasterPickerDialog
        open={open}
        onOpenChange={setOpen}
        title={`Pick ${label}`}
        resource={picker.resource}
        endpoint={picker.endpoint}
        displayFields={picker.display_fields}
        filter={filter}
        onSelect={select}
      />
    </div>
  )
}
