import { PackageSearch, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import type { ParameterPicker } from '../../../shared/types/simulation'
import { applyPickerSelection, isPickerAppendOne, removePickerValue } from './picker-logic'
import {
  isCrudEditor,
  pickerAddButtonLabel,
  pickerSelectButtonLabel,
} from '../parameter-field-logic'
import { MasterPickerDialog } from './master-picker-dialog'
import { ChatCrudDialog } from '../master-data/chat-crud-dialog'
import { CallCrudDialog } from '../master-data/call-crud-dialog'
import { PromptCrudDialog } from '../master-data/prompt-crud-dialog'
import { EmailCrudDialog } from '../master-data/email-crud-dialog'

export function MasterPickerField({
  label,
  value,
  required = false,
  multiline = false,
  picker,
  nodeId,
  nodeType,
  simulationId,
  filterValue,
  previewVariables,
  onChange,
}: {
  label: string
  value: unknown
  required?: boolean
  multiline?: boolean
  picker: ParameterPicker
  nodeId?: string
  nodeType?: string
  simulationId?: string | null
  filterValue?: string
  previewVariables?: Record<string, unknown>
  onChange: (value: string | string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [crudOpen, setCrudOpen] = useState(false)
  const filter =
    picker.filterBy && picker.filterField && filterValue
      ? { field: picker.filterField, value: filterValue }
      : undefined
  const values = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
  const isAppendOne = isPickerAppendOne(picker)
  const useCrud = isCrudEditor(picker) && Boolean(nodeId)
  const openPicker = () => (useCrud ? setCrudOpen(true) : setOpen(true))
  const select = (record: Record<string, unknown>) => {
    onChange(
      isAppendOne
        ? applyPickerSelection(values, record, picker)
        : record[picker.valueField] === null || record[picker.valueField] === undefined
          ? ''
          : String(record[picker.valueField]),
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
          <Button type="button" variant="outline" onClick={openPicker}>
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
          <Button type="button" variant="outline" onClick={openPicker}>
            <PackageSearch /> {pickerSelectButtonLabel(label)}
          </Button>
        </div>
      )}
      {useCrud && picker.editor === 'chat_crud' ? (
        <ChatCrudDialog
          open={crudOpen}
          onOpenChange={setCrudOpen}
          nodeId={nodeId!}
          nodeType={nodeType}
          onSelect={(chatId) => {
            onChange(chatId)
            setCrudOpen(false)
          }}
        />
      ) : useCrud && picker.editor === 'call_crud' ? (
        <CallCrudDialog
          open={crudOpen}
          onOpenChange={setCrudOpen}
          nodeId={nodeId!}
          nodeType={nodeType}
          onSelect={(callId) => {
            onChange(callId)
            setCrudOpen(false)
          }}
        />
      ) : useCrud && picker.editor === 'prompt_crud' ? (
        <PromptCrudDialog
          open={crudOpen}
          onOpenChange={setCrudOpen}
          nodeId={nodeId!}
          nodeType={nodeType}
          previewVariables={previewVariables}
          onSelect={(promptId) => {
            onChange(promptId)
            setCrudOpen(false)
          }}
        />
      ) : useCrud && picker.editor === 'email_crud' ? (
        <EmailCrudDialog
          open={crudOpen}
          onOpenChange={setCrudOpen}
          nodeId={nodeId!}
          nodeType={nodeType}
          simulationId={simulationId}
          onSelect={(emailId) => {
            onChange(emailId)
            setCrudOpen(false)
          }}
        />
      ) : (
        <MasterPickerDialog
          open={open}
          onOpenChange={setOpen}
          title={`Pick ${label}`}
          resource={picker.resource}
          endpoint={picker.endpoint}
          displayFields={picker.displayFields ?? [picker.valueField]}
          filter={filter}
          valueField={picker.valueField}
          selected={isAppendOne ? values : String(value ?? '')}
          onSelect={select}
        />
      )}
    </div>
  )
}
