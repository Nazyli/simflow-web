import { useEffect, useState, type FormEvent } from 'react'
import { Copy, GitBranch, PackageSearch, Plus, Save, Sliders, Trash2, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import type { NodeDefinition, ParameterPicker } from '../../shared/types/workflow'
import { MasterPickerDialog } from './pickers/master-picker-dialog'
import { MasterPickerField } from './pickers/master-picker-field'

type Configuration = Record<string, unknown>

export function NodeConfigurationForm({
  node,
  definition,
  onSave,
  onDuplicate,
  onDelete,
}: {
  node: {
    node_name: string
    node_type: string
    configuration: Configuration
    input_ports?: { id: string; label: string; max_connections?: number }[]
  }
  definition?: NodeDefinition
  onSave: (name: string, configuration: Configuration) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const [name, setName] = useState(node.node_name)
  const [configuration, setConfiguration] = useState<Configuration>({
    ...definition?.parameters,
    ...node.configuration,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(node.node_name)
    setConfiguration({ ...definition?.parameters, ...node.configuration })
    setError(null)
  }, [node, definition])

  function change(key: string, value: unknown) {
    setConfiguration((current) => ({ ...current, [key]: value }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const required = Object.entries(definition?.validation_rules ?? {})
      .filter(([, rule]) => isRequired(rule as Record<string, unknown>, configuration))
      .map(([key]) => key)
    const missing = required.filter(
      (key) =>
        configuration[key] === '' ||
        configuration[key] === null ||
        configuration[key] === undefined,
    )
    if (missing.length) {
      setError(`Required parameter: ${missing.join(', ')}`)
      return
    }
    onSave(name, configuration)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-semibold">Node Configuration</h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[0.625rem] font-bold tracking-wider text-slate-500 uppercase">
          {node.node_type}
        </span>
      </div>
      <TextField
        label="Node Name"
        value={name}
        onChange={setName}
        required
        placeholder="e.g. Process Order"
      />
      {node.input_ports?.length ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Input connections
          </p>
          <div className="mt-2 space-y-1.5">
            {node.input_ports.map((port) => (
              <div key={port.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-slate-700">{port.label}</span>
                <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-600 ring-1 ring-slate-200">
                  Max connections: {port.max_connections ?? 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {definition ? (
        Object.entries(definition.parameters)
          .filter(([key]) =>
            isVisible(
              definition.validation_rules[key] as Record<string, unknown> | undefined,
              configuration,
            ),
          )
          .map(([key, defaultValue]) => (
            <CatalogParameterField
              key={key}
              name={key}
              value={configuration[key]}
              defaultValue={defaultValue}
              required={isRequired(
                definition.validation_rules[key] as Record<string, unknown>,
                configuration,
              )}
              definition={definition}
              configuration={configuration}
              onChange={(value) => change(key, value)}
            />
          ))
      ) : (
        <p className="text-xs text-amber-700">Node definition is unavailable from the catalog.</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid gap-2">
        <Button type="submit" className="w-full">
          <Save className="h-4 w-4" /> Save Node
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onDuplicate}>
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </Button>
          <Button type="button" variant="destructive" className="flex-1" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>
    </form>
  )
}

function ruleMatches(
  rule: Record<string, unknown> | undefined,
  configuration: Configuration,
  key: 'visible_when' | 'required_when',
): boolean {
  const condition = rule?.[key]
  if (!condition || typeof condition !== 'object') return key === 'visible_when'
  const { field, equals } = condition as Record<string, unknown>
  return typeof field === 'string' && configuration[field] === equals
}

function isVisible(
  rule: Record<string, unknown> | undefined,
  configuration: Configuration,
): boolean {
  return ruleMatches(rule, configuration, 'visible_when')
}

function isRequired(
  rule: Record<string, unknown> | undefined,
  configuration: Configuration,
): boolean {
  return Boolean(rule?.required) || ruleMatches(rule, configuration, 'required_when')
}

function CatalogParameterField({
  name,
  value,
  defaultValue,
  required,
  definition,
  configuration,
  onChange,
}: {
  name: string
  value: unknown
  defaultValue: unknown
  required: boolean
  definition?: NodeDefinition
  configuration: Configuration
  onChange: (value: unknown) => void
}) {
  const label = name.replaceAll('_', ' ')
  const picker = definition?.parameter_options?.[name]?.picker
  if (name === 'actors')
    return (
      <ConversationGroupActorsField
        value={value}
        required={required}
        picker={picker}
        onChange={onChange}
      />
    )
  if (picker)
    return (
      <MasterPickerField
        label={label}
        value={value}
        required={required}
        multiline={['body'].includes(name)}
        picker={picker}
        filterValue={picker.filter_by ? String(configuration[picker.filter_by] ?? '') : undefined}
        onChange={(next) => onChange(next)}
      />
    )
  if (name === 'labels')
    return <ClassificationLabelsField value={value} required={required} onChange={onChange} />
  if (typeof defaultValue === 'boolean')
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={name}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(Boolean(checked))}
        />
        <Label htmlFor={name} className="cursor-pointer">
          {label}
        </Label>
      </div>
    )
  if (typeof defaultValue === 'number')
    return (
      <TextField
        label={label}
        value={value}
        onChange={(next) => onChange(Number(next))}
        required={required}
        type="number"
      />
    )
  if (typeof defaultValue === 'object')
    return (
      <JsonField
        label={label}
        value={value ?? defaultValue}
        required={required}
        onChange={onChange}
      />
    )
  const multiline = ['body'].includes(name)
  return (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      multiline={multiline}
    />
  )
}

function ConversationGroupActorsField({
  value,
  required,
  picker,
  onChange,
}: {
  value: unknown
  required: boolean
  picker?: ParameterPicker
  onChange: (value: unknown) => void
}) {
  const [open, setOpen] = useState(false)
  const actors = Array.isArray(value)
    ? value.filter(
        (item): item is { actor_id: string; actor_name?: string } =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as { actor_id?: unknown }).actor_id === 'string',
      )
    : []

  function updateActor(index: number, actorId: string) {
    onChange(
      actors.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, actor_id: actorId, actor_name: item.actor_name ?? actorId }
          : item,
      ),
    )
  }

  function removeActor(index: number) {
    onChange(actors.filter((_, itemIndex) => itemIndex !== index))
  }

  function addActor(record: Record<string, unknown>) {
    if (!picker) return
    const actorId = String(record[picker.value_field] ?? '')
    const actorName =
      picker.display_fields
        .map((field) => record[field])
        .find(
          (recordValue): recordValue is string =>
            typeof recordValue === 'string' && recordValue !== actorId,
        ) ?? actorId
    onChange([...actors, { actor_id: actorId, actor_name: actorName }])
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label className="capitalize">Actors</Label>
        {picker && (
          <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>
            <PackageSearch /> Add actor
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {actors.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              required={required}
              aria-label={`Actor ${index + 1}`}
              placeholder="actor_id"
              value={item.actor_id}
              onChange={(event) => updateActor(index, event.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove actor ${index + 1}`}
              onClick={() => removeActor(index)}
            >
              <X />
            </Button>
          </div>
        ))}
        {!actors.length && (
          <p className="text-xs text-slate-500">
            Add at least one actor. Each actor becomes an output port.
          </p>
        )}
      </div>
      {picker && (
        <MasterPickerDialog
          open={open}
          onOpenChange={setOpen}
          title="Pick actor"
          resource={picker.resource}
          endpoint={picker.endpoint}
          displayFields={picker.display_fields}
          onSelect={addActor}
        />
      )}
    </div>
  )
}

function ClassificationLabelsField({
  value,
  required,
  onChange,
}: {
  value: unknown
  required: boolean
  onChange: (value: unknown) => void
}) {
  const labels = Array.isArray(value)
    ? value.filter(
        (item): item is { id: string; label?: string } =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as { id?: unknown }).id === 'string',
      )
    : []
  const rows = labels.length ? labels : [{ id: '', label: '' }]

  function updateLabel(index: number, label: string) {
    onChange(rows.map((item, itemIndex) => (itemIndex === index ? { id: label, label } : item)))
  }

  function removeLabel(index: number) {
    onChange(labels.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>Labels</Label>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onChange([...labels, { id: '', label: '' }])}
        >
          <Plus /> Add label
        </Button>
      </div>
      <div className="space-y-2">
        {rows.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              required={required}
              aria-label={`Label ${index + 1}`}
              placeholder="e.g. probing"
              value={item.label ?? item.id}
              onChange={(event) => updateLabel(index, event.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove label ${index + 1}`}
              onClick={() => removeLabel(index)}
            >
              <X />
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">Each label becomes an output port.</p>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  placeholder,
  type = 'text',
  multiline = false,
}: {
  label: string
  value: unknown
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  type?: string
  multiline?: boolean
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="capitalize">{label}</Label>
      {multiline ? (
        <Textarea
          required={required}
          placeholder={placeholder}
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          type={type}
          required={required}
          placeholder={placeholder}
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  )
}

function JsonField({
  label,
  value,
  required,
  onChange,
}: {
  label: string
  value: unknown
  required: boolean
  onChange: (value: unknown) => void
}) {
  const [raw, setRaw] = useState(() => JSON.stringify(value, null, 2))
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    setRaw(JSON.stringify(value, null, 2))
    setError(null)
  }, [value])
  return (
    <div className="grid gap-1.5">
      <Label className="capitalize">{label}</Label>
      <Textarea
        className="font-mono text-xs"
        required={required}
        value={raw}
        onChange={(event) => {
          const next = event.target.value
          setRaw(next)
          try {
            onChange(JSON.parse(next))
            setError(null)
          } catch {
            setError('Must be valid JSON.')
          }
        }}
      />
      {error && <small className="text-xs text-red-600">{error}</small>}
    </div>
  )
}

export function EdgeConfigurationForm({
  priority,
  onSave,
  onDelete,
}: {
  priority: number
  onSave: (priority: number) => void
  onDelete: () => void
}) {
  const [nextPriority, setPriority] = useState(priority)
  useEffect(() => {
    setPriority(priority)
  }, [priority])
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(nextPriority)
      }}
    >
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-semibold">Edge Inspector</h3>
        </div>
      </div>
      <TextField
        label="Priority Order"
        value={nextPriority}
        type="number"
        onChange={(value) => setPriority(Number(value))}
      />
      <div className="grid gap-2">
        <Button type="submit" className="w-full">
          <Save className="h-4 w-4" /> Save Edge
        </Button>
        <Button type="button" variant="destructive" className="w-full" onClick={onDelete}>
          <Trash2 className="h-4 w-4" /> Delete Edge
        </Button>
      </div>
    </form>
  )
}
