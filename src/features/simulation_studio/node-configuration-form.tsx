import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
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
import { getMasterEmailByNode, type MasterEmailAttachment } from '../../shared/api/master-data'
import type { NodeDefinition } from '../../shared/types/simulation'
import {
  buildClassificationPreviewVariables,
  isNumericParameter,
  parseNumericParameter,
  resolveParameterMultiline,
} from './parameter-field-logic'
import { MasterPickerField } from './pickers/master-picker-field'

type Configuration = Record<string, unknown>

type GraphNode = {
  nodeId: string
  nodeName: string
  nodeType: string
  parameters: Configuration
}

const attachmentOpenParameterNames = new Set([
  'sourceSendEmailNodeId',
  'attachmentSelection',
  'attachmentIds',
  'completionMode',
  'minimumOpened',
])

export function NodeConfigurationForm({
  node,
  definition,
  onSave,
  onDuplicate,
  onDelete,
  graphNodes = [],
  readonly = false,
  simulationId,
}: {
  node: {
    nodeId?: string
    nodeName: string
    nodeType: string
    configuration: Configuration
    inputPorts?: { id: string; label: string; maxConnections?: number }[]
  }
  definition?: NodeDefinition
  onSave: (name: string, configuration: Configuration) => void
  onDuplicate: () => void
  onDelete: () => void
  graphNodes?: GraphNode[]
  readonly?: boolean
  simulationId?: string | null
}) {
  const [name, setName] = useState(node.nodeName)
  const [configuration, setConfiguration] = useState<Configuration>({
    ...definition?.parameters,
    ...node.configuration,
  })
  const [error, setError] = useState<string | null>(null)

  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  const latestRef = useRef({
    name,
    configuration,
    readonly,
    nodeType: node.nodeType,
    definition,
    graphNodes,
    simulationId,
  })
  latestRef.current = {
    name,
    configuration,
    readonly,
    nodeType: node.nodeType,
    definition,
    graphNodes,
    simulationId,
  }
  const savedSnapshot = useRef<{ name: string; configuration: string } | null>(null)
  if (savedSnapshot.current === null) {
    savedSnapshot.current = {
      name: node.nodeName,
      configuration: stableStringify({ ...definition?.parameters, ...node.configuration }),
    }
  }

  useEffect(() => {
    // Adopt external updates (drag/rotate autosaves, server refresh) only while
    // there are no unsaved local edits, so in-progress typing is never clobbered.
    const snapshot = savedSnapshot.current
    if (!snapshot) return
    if (name !== snapshot.name || stableStringify(configuration) !== snapshot.configuration) return
    const nextConfiguration = { ...definition?.parameters, ...node.configuration }
    const nextConfigurationKey = stableStringify(nextConfiguration)
    if (node.nodeName === name && nextConfigurationKey === snapshot.configuration) return
    setName(node.nodeName)
    setConfiguration(nextConfiguration)
    setError(null)
    savedSnapshot.current = { name: node.nodeName, configuration: nextConfigurationKey }
  }, [node, definition, name, configuration])

  useEffect(() => {
    // Debounced autosave: persist shortly after the user stops typing.
    if (readonly) return
    const snapshot = savedSnapshot.current
    if (!snapshot) return
    if (name === snapshot.name && stableStringify(configuration) === snapshot.configuration) return
    if (validateNodeForm(node.nodeType, name, configuration, definition, graphNodes) !== null)
      return
    const timer = setTimeout(() => {
      savedSnapshot.current = { name, configuration: stableStringify(configuration) }
      setError(null)
      onSaveRef.current(name, configuration)
    }, 800)
    return () => clearTimeout(timer)
  }, [readonly, node.nodeType, name, configuration, definition, graphNodes])

  useEffect(() => {
    // Flush pending edits when the form unmounts (e.g. selecting another node).
    return () => {
      const latest = latestRef.current
      const snapshot = savedSnapshot.current
      if (!snapshot || latest.readonly) return
      if (
        latest.name === snapshot.name &&
        stableStringify(latest.configuration) === snapshot.configuration
      )
        return
      if (
        validateNodeForm(
          latest.nodeType,
          latest.name,
          latest.configuration,
          latest.definition,
          latest.graphNodes,
        ) !== null
      )
        return
      onSaveRef.current(latest.name, latest.configuration)
    }
  }, [])

  function change(key: string, value: unknown) {
    setConfiguration((current) => ({ ...current, [key]: value }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateNodeForm(
      node.nodeType,
      name,
      configuration,
      definition,
      graphNodes,
    )
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    savedSnapshot.current = { name, configuration: stableStringify(configuration) }
    onSave(name, configuration)
  }

  return (
    <form className="flex min-w-0 flex-col gap-4" onSubmit={submit}>
      {readonly && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-normal text-amber-800">
          Read-only — this simulation has been used and cannot be edited. Duplicate it to make
          changes.
        </div>
      )}
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[#DBE3EC] pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 shrink-0 text-[#9929EA]" />
          <h3 className="text-sm font-semibold text-slate-900">Node configuration</h3>
        </div>
        <span className="max-w-36 truncate rounded-md border border-[#DBE3EC] bg-[#F5E7FF] px-2 py-0.5 text-[0.625rem] font-bold tracking-wider text-[#5B148F] uppercase">
          {node.nodeType}
        </span>
      </div>
      <TextField
        label="Node Name"
        value={name}
        onChange={setName}
        required
        placeholder="e.g. Process Order"
      />
      {node.inputPorts?.length ? (
        <div className="rounded-md border border-[#DBE3EC] bg-slate-50/80 p-3">
          <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Input connections
          </p>
          <div className="mt-2 space-y-1.5">
            {node.inputPorts.map((port) => (
              <div key={port.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-slate-700">{port.label}</span>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-600">
                  Max connections: {port.maxConnections ?? 1}
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
              node.nodeType !== 'wait_for_attachment_open' ||
              !attachmentOpenParameterNames.has(key),
          )
          .filter(([key]) =>
            isVisible(
              definition.validationRules[key] as Record<string, unknown> | undefined,
              configuration,
            ),
          )
          .map(([key, defaultValue]) => (
            <CatalogParameterField
              key={key}
              name={key}
              nodeType={node.nodeType}
              value={configuration[key]}
              defaultValue={defaultValue}
              nodeId={node.nodeId}
              simulationId={simulationId}
              required={isRequired(
                definition.validationRules[key] as Record<string, unknown>,
                configuration,
              )}
              validationRule={
                definition.validationRules[key] as Record<string, unknown> | undefined
              }
              definition={definition}
              configuration={configuration}
              onChange={(value) => change(key, value)}
            />
          ))
      ) : (
        <p className="text-xs text-amber-700">Node definition is unavailable from the catalog.</p>
      )}
      {node.nodeType === 'wait_for_attachment_open' ? (
        <AttachmentOpenConfigurationFields
          configuration={configuration}
          graphNodes={graphNodes}
          onChange={(patch) => setConfiguration((current) => ({ ...current, ...patch }))}
        />
      ) : null}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid gap-2 border-t border-[#DBE3EC] pt-3">
        <Button type="submit" className="w-full" disabled={readonly}>
          <Save className="h-4 w-4" /> Save Node
        </Button>
        {!readonly && (
          <p className="text-center text-[11px] text-slate-400">
            Changes save automatically when you stop typing.
          </p>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onDuplicate}
            disabled={readonly}
          >
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={onDelete}
            disabled={readonly}
          >
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

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value) ?? String(value)
}

function validateNodeForm(
  nodeType: string,
  name: string,
  configuration: Configuration,
  definition: NodeDefinition | undefined,
  graphNodes: GraphNode[],
): string | null {
  if (!name.trim()) return 'Node name is required.'
  const required = Object.entries(definition?.validationRules ?? {})
    .filter(([, rule]) => isRequired(rule as Record<string, unknown>, configuration))
    .map(([key]) => key)
  const missing = required.filter((key) => isMissing(configuration[key]))
  if (missing.length) return `Required parameter: ${missing.join(', ')}`
  return validateAttachmentOpenConfiguration(nodeType, configuration, graphNodes)
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
  const sourceNodeId = configuration.sourceSendEmailNodeId
  const sourceNode = graphNodes.find(
    (candidate) => candidate.nodeId === sourceNodeId && candidate.nodeType === 'send_email',
  )
  if (!sourceNode) return 'Choose a source Send Email node.'
  if (typeof sourceNode.parameters.emailId !== 'string' || !sourceNode.parameters.emailId.trim())
    return 'The selected Send Email node must have an email template.'
  const selection = configuration.attachmentSelection
  const attachmentIds = stringArray(configuration.attachmentIds)
  if (selection === 'selected' && !attachmentIds.length)
    return 'Select at least one attachment to monitor.'
  if (selection === 'all' && attachmentIds.length)
    return 'All attachments uses an empty attachment list.'
  if (new Set(attachmentIds).size !== attachmentIds.length)
    return 'An attachment may only be selected once.'
  if (configuration.completionMode === 'minimum') {
    const minimumOpened = Number(configuration.minimumOpened)
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
  const sourceNodes = graphNodes.filter((candidate) => candidate.nodeType === 'send_email')
  const sourceNodeId =
    typeof configuration.sourceSendEmailNodeId === 'string'
      ? configuration.sourceSendEmailNodeId
      : ''
  const sourceNode = sourceNodes.find((candidate) => candidate.nodeId === sourceNodeId)
  const emailId =
    typeof sourceNode?.parameters.emailId === 'string' ? sourceNode.parameters.emailId : ''
  const emailDetail = useQuery({
    queryKey: ['studio-master-email-by-node', sourceNodeId],
    queryFn: () => getMasterEmailByNode(sourceNodeId),
    enabled: Boolean(sourceNodeId),
  })
  const attachments = emailDetail.data?.attachments ?? []
  const attachmentSelection = configuration.attachmentSelection === 'all' ? 'all' : 'selected'
  const attachmentIds = stringArray(configuration.attachmentIds)
  const completionMode = configuration.completionMode === 'all' ? 'all' : 'minimum'
  const minimumOpened = Number(configuration.minimumOpened ?? 1)

  function updateAttachment(attachmentId: string, checked: boolean) {
    const next = checked
      ? [...attachmentIds, attachmentId]
      : attachmentIds.filter((candidate) => candidate !== attachmentId)
    onChange({ attachmentIds: next })
  }

  return (
    <div className="grid gap-4 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
      <div className="grid gap-1.5">
        <Label htmlFor="source-send-email-node">Source email</Label>
        <Select
          value={sourceNodeId}
          onValueChange={(value) => onChange({ sourceSendEmailNodeId: value, attachmentIds: [] })}
        >
          <SelectTrigger id="source-send-email-node" className="w-full bg-white">
            <SelectValue placeholder="Choose a Send Email node" />
          </SelectTrigger>
          <SelectContent>
            {sourceNodes.map((candidate) => (
              <SelectItem key={candidate.nodeId} value={candidate.nodeId}>
                {candidate.nodeName}
                {typeof candidate.parameters.emailId === 'string'
                  ? ` (${candidate.parameters.emailId})`
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
              attachmentSelection: value,
              attachmentIds: [],
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
          onValueChange={(value) => onChange({ completionMode: value })}
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
            onChange={(value) => onChange({ minimumOpened: Number(value) })}
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
          key={attachment.attachmentId}
          className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-emerald-50"
        >
          <Checkbox
            checked={selectedIds.includes(attachment.attachmentId)}
            disabled={disabled}
            onCheckedChange={(checked) => onChange(attachment.attachmentId, checked === true)}
          />
          <span>{attachment.documentName}</span>
        </label>
      ))}
    </div>
  )
}

function ruleMatches(
  rule: Record<string, unknown> | undefined,
  configuration: Configuration,
  key: 'visibleWhen' | 'requiredWhen',
): boolean {
  const condition = rule?.[key]
  if (!condition || typeof condition !== 'object') return key === 'visibleWhen'
  const { field, equals } = condition as Record<string, unknown>
  return typeof field === 'string' && configuration[field] === equals
}

function isVisible(
  rule: Record<string, unknown> | undefined,
  configuration: Configuration,
): boolean {
  return ruleMatches(rule, configuration, 'visibleWhen')
}

function isRequired(
  rule: Record<string, unknown> | undefined,
  configuration: Configuration,
): boolean {
  return Boolean(rule?.required) || ruleMatches(rule, configuration, 'requiredWhen')
}

function CatalogParameterField({
  name,
  nodeType,
  value,
  defaultValue,
  nodeId,
  simulationId,
  validationRule,
  required,
  definition,
  configuration,
  onChange,
}: {
  name: string
  nodeType: string
  value: unknown
  defaultValue: unknown
  nodeId?: string
  simulationId?: string | null
  validationRule?: Record<string, unknown>
  required: boolean
  definition?: NodeDefinition
  configuration: Configuration
  onChange: (value: unknown) => void
}) {
  const label = name.replaceAll('_', ' ')
  const select = definition?.parameterOptions?.[name]?.select
  const picker = definition?.parameterOptions?.[name]?.picker
  if (name === 'groups')
    return <ConversationGroupGroupsField value={value} required={required} onChange={onChange} />
  if (name === 'defaultGroupId') {
    const groupOptions = Array.isArray(configuration.groups)
      ? (configuration.groups as unknown[]).filter(
          (item): item is { id: string; label: string } =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as { id?: unknown }).id === 'string' &&
            typeof (item as { label?: unknown }).label === 'string' &&
            (item as { id: string }).id.trim() !== '' &&
            (item as { label: string }).label.trim() !== '',
        )
      : []
    const hasOptions = groupOptions.length > 0
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={name} className="capitalize">
          {label}
        </Label>
        <Select
          name={name}
          required={required}
          value={typeof value === 'string' && value ? value : undefined}
          onValueChange={(next) => onChange(next)}
          disabled={!hasOptions}
        >
          <SelectTrigger id={name} className="w-full">
            <SelectValue placeholder={hasOptions ? `Select ${label}` : 'Add groups first'} />
          </SelectTrigger>
          <SelectContent>
            {groupOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!hasOptions && <p className="text-xs text-slate-500">Add groups first</p>}
      </div>
    )
  }
  if (select)
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={name} className="capitalize">
          {label}
        </Label>
        <Select
          name={name}
          required={required}
          value={typeof value === 'string' && value ? value : undefined}
          onValueChange={onChange}
        >
          <SelectTrigger id={name} className="w-full">
            <SelectValue placeholder={`Select ${label}`} />
          </SelectTrigger>
          <SelectContent>
            {select.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  if (picker)
    return (
      <MasterPickerField
        label={label}
        value={value}
        required={required}
        multiline={resolveParameterMultiline(name, definition?.parameterOptions)}
        picker={picker}
        nodeId={nodeId}
        nodeType={nodeType}
        simulationId={simulationId}
        filterValue={picker.filterBy ? String(configuration[picker.filterBy] ?? '') : undefined}
        previewVariables={buildClassificationPreviewVariables(nodeType, name, configuration)}
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
  if (isNumericParameter(defaultValue, validationRule))
    return (
      <TextField
        label={label}
        value={value}
        onChange={(next) => onChange(parseNumericParameter(next))}
        required={required}
        type="number"
        min={typeof validationRule?.minimum === 'number' ? validationRule.minimum : undefined}
        max={typeof validationRule?.maximum === 'number' ? validationRule.maximum : undefined}
        step={
          validationRule?.type === 'integer' || typeof validationRule?.minimum === 'number'
            ? 1
            : undefined
        }
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
  const multiline = resolveParameterMultiline(name, definition?.parameterOptions)
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
  min,
  max,
  step,
}: {
  label: string
  value: unknown
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  type?: string
  multiline?: boolean
  min?: number
  max?: number
  step?: number
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
          min={min}
          max={max}
          step={step}
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
  onSave,
  onDelete,
  readonly = false,
}: {
  onSave: () => void
  onDelete: () => void
  readonly?: boolean
}) {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      {readonly && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-normal text-amber-800">
          Read-only — this simulation has been used and cannot be edited. Duplicate it to make
          changes.
        </div>
      )}
      <div className="flex items-center justify-between border-b border-[#DBE3EC] pb-2.5">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-[#9929EA]" />
          <h3 className="text-sm font-semibold text-slate-900">Edge inspector</h3>
        </div>
      </div>
      <div className="grid gap-2">
        <Button type="submit" className="w-full" disabled={readonly}>
          <Save className="h-4 w-4" /> Save Edge
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={onDelete}
          disabled={readonly}
        >
          <Trash2 className="h-4 w-4" /> Delete Edge
        </Button>
      </div>
    </form>
  )
}
