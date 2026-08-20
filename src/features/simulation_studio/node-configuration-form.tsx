import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Copy, GitBranch, Plus, Save, Sliders, Trash2, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { getStudioMasterEmail, type MasterEmailAttachment } from '../../shared/api/master-data'
import type { NodeDefinition } from '../../shared/types/workflow'
import { MasterPickerField } from './pickers/master-picker-field'

type Configuration = Record<string, unknown>

type GraphNode = {
  node_id: string
  node_name: string
  node_type: string
  parameters: Configuration
}

const attachmentOpenParameterNames = new Set([
  'source_send_email_node_id',
  'attachment_selection',
  'attachment_ids',
  'completion_mode',
  'minimum_opened',
])

export function NodeConfigurationForm({
  node,
  definition,
  onSave,
  onDuplicate,
  onDelete,
  graphNodes = [],
}: {
  node: {
    node_id?: string
    node_name: string
    node_type: string
    configuration: Configuration
    input_ports?: { id: string; label: string; max_connections?: number }[]
  }
  definition?: NodeDefinition
  onSave: (name: string, configuration: Configuration) => void
  onDuplicate: () => void
  onDelete: () => void
  graphNodes?: GraphNode[]
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
    const missing = required.filter((key) => isMissing(configuration[key]))
    if (missing.length) {
      setError(`Required parameter: ${missing.join(', ')}`)
      return
    }
    const attachmentOpenError = validateAttachmentOpenConfiguration(
      node.node_type,
      configuration,
      graphNodes,
    )
    if (attachmentOpenError) {
      setError(attachmentOpenError)
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
          .filter(
            ([key]) =>
              node.node_type !== 'wait_for_attachment_open' ||
              !attachmentOpenParameterNames.has(key),
          )
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
      {node.node_type === 'wait_for_attachment_open' ? (
        <AttachmentOpenConfigurationFields
          configuration={configuration}
          graphNodes={graphNodes}
          onChange={(patch) => setConfiguration((current) => ({ ...current, ...patch }))}
        />
      ) : null}
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

function isMissing(value: unknown): boolean {
  return (
    value === '' ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0)
  )
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function validateAttachmentOpenConfiguration(
  nodeType: string,
  configuration: Configuration,
  graphNodes: GraphNode[],
): string | null {
  if (nodeType !== 'wait_for_attachment_open') return null
  const sourceNodeId = configuration.source_send_email_node_id
  const sourceNode = graphNodes.find(
    (candidate) => candidate.node_id === sourceNodeId && candidate.node_type === 'send_email',
  )
  if (!sourceNode) return 'Choose a source Send Email node.'
  if (typeof sourceNode.parameters.email_id !== 'string' || !sourceNode.parameters.email_id.trim())
    return 'The selected Send Email node must have an email template.'
  const selection = configuration.attachment_selection
  const attachmentIds = stringArray(configuration.attachment_ids)
  if (selection === 'selected' && !attachmentIds.length)
    return 'Select at least one attachment to monitor.'
  if (selection === 'all' && attachmentIds.length)
    return 'All attachments uses an empty attachment list.'
  if (new Set(attachmentIds).size !== attachmentIds.length)
    return 'An attachment may only be selected once.'
  if (configuration.completion_mode === 'minimum') {
    const minimumOpened = Number(configuration.minimum_opened)
    if (!Number.isInteger(minimumOpened) || minimumOpened < 1)
      return 'Minimum opened attachments must be at least 1.'
    if (selection === 'selected' && minimumOpened > attachmentIds.length)
      return 'Minimum opened attachments cannot exceed the selected attachments.'
  }
  return null
}

function AttachmentOpenConfigurationFields({
  configuration,
  graphNodes,
  onChange,
}: {
  configuration: Configuration
  graphNodes: GraphNode[]
  onChange: (patch: Configuration) => void
}) {
  const sourceNodes = graphNodes.filter((candidate) => candidate.node_type === 'send_email')
  const sourceNodeId =
    typeof configuration.source_send_email_node_id === 'string'
      ? configuration.source_send_email_node_id
      : ''
  const sourceNode = sourceNodes.find((candidate) => candidate.node_id === sourceNodeId)
  const emailId =
    typeof sourceNode?.parameters.email_id === 'string' ? sourceNode.parameters.email_id : ''
  const emailDetail = useQuery({
    queryKey: ['studio-master-email', emailId],
    queryFn: () => getStudioMasterEmail(emailId),
    enabled: Boolean(emailId),
  })
  const attachments = emailDetail.data?.attachments ?? []
  const attachmentSelection = configuration.attachment_selection === 'all' ? 'all' : 'selected'
  const attachmentIds = stringArray(configuration.attachment_ids)
  const completionMode = configuration.completion_mode === 'all' ? 'all' : 'minimum'
  const minimumOpened = Number(configuration.minimum_opened ?? 1)

  function updateAttachment(attachmentId: string, checked: boolean) {
    const next = checked
      ? [...attachmentIds, attachmentId]
      : attachmentIds.filter((candidate) => candidate !== attachmentId)
    onChange({ attachment_ids: next })
  }

  return (
    <div className="grid gap-4 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
      <div className="grid gap-1.5">
        <Label htmlFor="source-send-email-node">Source email</Label>
        <Select
          value={sourceNodeId || undefined}
          onValueChange={(value) =>
            onChange({ source_send_email_node_id: value, attachment_ids: [] })
          }
        >
          <SelectTrigger id="source-send-email-node" className="w-full bg-white">
            <SelectValue placeholder="Choose a Send Email node" />
          </SelectTrigger>
          <SelectContent>
            {sourceNodes.map((candidate) => (
              <SelectItem key={candidate.node_id} value={candidate.node_id}>
                {candidate.node_name}
                {typeof candidate.parameters.email_id === 'string'
                  ? ` (${candidate.parameters.email_id})`
                  : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!sourceNodes.length ? (
          <p className="text-xs text-amber-700">Add and configure a Send Email node first.</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="attachment-selection">Attachments to monitor</Label>
        <Select
          value={attachmentSelection}
          onValueChange={(value) =>
            onChange({
              attachment_selection: value,
              attachment_ids: [],
            })
          }
          disabled={!emailId}
        >
          <SelectTrigger id="attachment-selection" className="w-full bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="selected">Selected attachments</SelectItem>
            <SelectItem value="all">All attachments in this email</SelectItem>
          </SelectContent>
        </Select>
        {attachmentSelection === 'all' ? (
          <p className="text-xs text-slate-600">
            Every attachment on the sent email will be monitored at runtime.
          </p>
        ) : emailDetail.isLoading ? (
          <p className="text-xs text-slate-600">Loading source email attachments…</p>
        ) : emailDetail.isError ? (
          <p className="text-xs text-red-600">Unable to load source email attachments.</p>
        ) : emailId && !attachments.length ? (
          <p className="text-xs text-amber-700">The selected email has no attachments.</p>
        ) : (
          <AttachmentPicker
            attachments={attachments}
            selectedIds={attachmentIds}
            disabled={!emailId}
            onChange={updateAttachment}
          />
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="completion-mode">Completion</Label>
        <Select
          value={completionMode}
          onValueChange={(value) => onChange({ completion_mode: value })}
          disabled={!emailId}
        >
          <SelectTrigger id="completion-mode" className="w-full bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minimum">At least N attachments opened</SelectItem>
            <SelectItem value="all">All qualifying attachments opened</SelectItem>
          </SelectContent>
        </Select>
        {completionMode === 'minimum' ? (
          <TextField
            label="Minimum opened attachments"
            value={minimumOpened}
            type="number"
            required
            onChange={(value) => onChange({ minimum_opened: Number(value) })}
          />
        ) : null}
      </div>
    </div>
  )
}

function AttachmentPicker({
  attachments,
  selectedIds,
  disabled,
  onChange,
}: {
  attachments: MasterEmailAttachment[]
  selectedIds: string[]
  disabled: boolean
  onChange: (attachmentId: string, checked: boolean) => void
}) {
  return (
    <div className="space-y-2 rounded-md border border-emerald-100 bg-white p-2">
      {attachments.map((attachment) => (
        <label
          key={attachment.attachment_id}
          className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-emerald-50"
        >
          <Checkbox
            checked={selectedIds.includes(attachment.attachment_id)}
            disabled={disabled}
            onCheckedChange={(checked) => onChange(attachment.attachment_id, checked === true)}
          />
          <span>{attachment.document_name}</span>
        </label>
      ))}
    </div>
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
  if (name === 'groups')
    return <ConversationGroupGroupsField value={value} required={required} onChange={onChange} />
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

function ConversationGroupGroupsField({
  value,
  required,
  onChange,
}: {
  value: unknown
  required: boolean
  onChange: (value: unknown) => void
}) {
  const groups = Array.isArray(value)
    ? value.filter(
        (item): item is { id: string; label: string } =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as { id?: unknown }).id === 'string' &&
          typeof (item as { label?: unknown }).label === 'string',
      )
    : []

  function updateGroup(index: number, field: 'id' | 'label', next: string) {
    onChange(
      groups.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: next } : item)),
    )
  }

  function removeGroup(index: number) {
    onChange(groups.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>Conversation groups</Label>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onChange([...groups, { id: '', label: '' }])}
        >
          <Plus /> Add group
        </Button>
      </div>
      <div className="space-y-2">
        {groups.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              required={required}
              aria-label={`Group ID ${index + 1}`}
              placeholder="support"
              value={item.id}
              onChange={(event) => updateGroup(index, 'id', event.target.value)}
            />
            <Input
              required={required}
              aria-label={`Group label ${index + 1}`}
              placeholder="Diskusi Support"
              value={item.label}
              onChange={(event) => updateGroup(index, 'label', event.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove group ${index + 1}`}
              onClick={() => removeGroup(index)}
            >
              <X />
            </Button>
          </div>
        ))}
        {!groups.length && (
          <p className="text-xs text-slate-500">
            Add at least one subgroup. Each subgroup becomes an output port.
          </p>
        )}
      </div>
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
