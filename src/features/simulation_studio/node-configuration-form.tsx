import { useEffect, useState, type FormEvent } from 'react'
import { Copy, GitBranch, Save, Sliders, Trash2 } from 'lucide-react'
import type { NodeDefinition } from '../../shared/types/workflow'

type Configuration = Record<string, unknown>

export function NodeConfigurationForm({ node, definition, onSave, onDuplicate, onDelete }: { node: { node_name: string; node_type: string; configuration: Configuration }; definition?: NodeDefinition; onSave: (name: string, configuration: Configuration) => void; onDuplicate: () => void; onDelete: () => void }) {
  const [name, setName] = useState(node.node_name)
  const [configuration, setConfiguration] = useState<Configuration>({ ...definition?.parameters, ...node.configuration })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(node.node_name)
    setConfiguration({ ...definition?.parameters, ...node.configuration })
    setError(null)
  }, [node, definition])

  function change(key: string, value: unknown) { setConfiguration((current) => ({ ...current, [key]: value })) }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const required = Object.entries(definition?.validation_rules ?? {}).filter(([, rule]) => isRequired(rule as Record<string, unknown>, configuration)).map(([key]) => key)
    const missing = required.filter((key) => configuration[key] === '' || configuration[key] === null || configuration[key] === undefined)
    if (missing.length) {
      setError(`Required parameter: ${missing.join(', ')}`)
      return
    }
    onSave(name, configuration)
  }

  return <form className="node-configuration-form flex flex-col gap-4" onSubmit={submit}>
    <div className="inspector-section-header">
      <div className="flex items-center gap-2"><Sliders className="w-4 h-4 text-purple-600" /><h3 className="font-semibold text-sm">Node Configuration</h3></div>
      <span className="node-type-badge">{node.node_type}</span>
    </div>
    <TextField label="Node Name" value={name} onChange={setName} required placeholder="e.g. Process Order" />
    {definition ? Object.entries(definition.parameters).filter(([key]) => isVisible(definition.validation_rules[key] as Record<string, unknown> | undefined, configuration)).map(([key, defaultValue]) => <CatalogParameterField key={key} name={key} value={configuration[key]} defaultValue={defaultValue} required={isRequired(definition.validation_rules[key] as Record<string, unknown>, configuration)} onChange={(value) => change(key, value)} />) : <p className="text-xs text-amber-700">Node definition is unavailable from the catalog.</p>}
    {error && <p className="text-xs text-red-600">{error}</p>}
    <div className="inspector-actions">
      <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> Save Node</button>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={onDuplicate}><Copy className="w-3.5 h-3.5" /> Duplicate</button>
        <button type="button" className="btn-danger flex-1" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /> Delete</button>
      </div>
    </div>
  </form>
}

function ruleMatches(rule: Record<string, unknown> | undefined, configuration: Configuration, key: 'visible_when' | 'required_when'): boolean {
  const condition = rule?.[key]
  if (!condition || typeof condition !== 'object') return key === 'visible_when'
  const { field, equals } = condition as Record<string, unknown>
  return typeof field === 'string' && configuration[field] === equals
}

function isVisible(rule: Record<string, unknown> | undefined, configuration: Configuration): boolean {
  return ruleMatches(rule, configuration, 'visible_when')
}

function isRequired(rule: Record<string, unknown> | undefined, configuration: Configuration): boolean {
  return Boolean(rule?.required) || ruleMatches(rule, configuration, 'required_when')
}

function CatalogParameterField({ name, value, defaultValue, required, onChange }: { name: string; value: unknown; defaultValue: unknown; required: boolean; onChange: (value: unknown) => void }) {
  const label = name.replaceAll('_', ' ')
  if (typeof defaultValue === 'boolean') return <label className="checkbox-label"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>
  if (typeof defaultValue === 'number') return <TextField label={label} value={value} onChange={(next) => onChange(Number(next))} required={required} type="number" />
  if (typeof defaultValue === 'object') return <JsonField label={label} value={value ?? defaultValue} required={required} onChange={onChange} />
  const multiline = ['body', 'content', 'input'].includes(name)
  return <TextField label={label} value={value} onChange={onChange} required={required} multiline={multiline} />
}

function TextField({ label, value, onChange, required = false, placeholder, type = 'text', multiline = false }: { label: string; value: unknown; onChange: (value: string) => void; required?: boolean; placeholder?: string; type?: string; multiline?: boolean }) {
  return <div className="form-group"><label className="form-label capitalize">{label}</label>{multiline ? <textarea className="form-textarea" required={required} placeholder={placeholder} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} /> : <input className="form-input" type={type} required={required} placeholder={placeholder} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />}</div>
}

function JsonField({ label, value, required, onChange }: { label: string; value: unknown; required: boolean; onChange: (value: unknown) => void }) {
  const [raw, setRaw] = useState(() => JSON.stringify(value, null, 2))
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { setRaw(JSON.stringify(value, null, 2)); setError(null) }, [value])
  return <div className="form-group"><label className="form-label capitalize">{label}</label><textarea className="form-textarea font-mono text-xs" required={required} value={raw} onChange={(event) => { const next = event.target.value; setRaw(next); try { onChange(JSON.parse(next)); setError(null) } catch { setError('Must be valid JSON.') } }} />{error && <small className="text-xs text-red-600">{error}</small>}</div>
}

export function EdgeConfigurationForm({ priority, onSave, onDelete }: { priority: number; onSave: (priority: number) => void; onDelete: () => void }) {
  const [nextPriority, setPriority] = useState(priority)
  useEffect(() => { setPriority(priority) }, [priority])
  return <form className="node-configuration-form flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); onSave(nextPriority) }}>
    <div className="inspector-section-header"><div className="flex items-center gap-2"><GitBranch className="w-4 h-4 text-purple-600" /><h3 className="font-semibold text-sm">Edge Inspector</h3></div></div>
    <TextField label="Priority Order" value={nextPriority} type="number" onChange={(value) => setPriority(Number(value))} />
    <div className="inspector-actions"><button type="submit" className="btn-primary"><Save className="w-4 h-4" /> Save Edge</button><button type="button" className="btn-danger" onClick={onDelete}><Trash2 className="w-4 h-4" /> Delete Edge</button></div>
  </form>
}
