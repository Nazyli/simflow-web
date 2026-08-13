import { PackageSearch } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import type { ParameterPicker } from '../../../shared/types/workflow'
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
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const filter =
    picker.filter_by && picker.filter_field && filterValue
      ? { field: picker.filter_field, value: filterValue }
      : undefined
  return (
    <div className="grid gap-1.5">
      <Label className="capitalize">{label}</Label>
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
          <PackageSearch /> Pick
        </Button>
      </div>
      <MasterPickerDialog
        open={open}
        onOpenChange={setOpen}
        title={`Pick ${label}`}
        resource={picker.resource}
        endpoint={picker.endpoint}
        displayFields={picker.display_fields}
        filter={filter}
        onSelect={(record) => {
          const selected = record[picker.value_field]
          onChange(selected === null || selected === undefined ? '' : String(selected))
        }}
      />
    </div>
  )
}
