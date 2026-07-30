import { useState, type FormEvent } from 'react'
import { validateActionPayload } from './action-composers'

type Configuration = Record<string, unknown>
type ConditionLeaf = { path: string; operator: string; value: unknown }
type ConditionGroup = { operator: 'and' | 'or'; conditions: ConditionItem[] }
type ConditionItem = ConditionLeaf | ConditionGroup

const actionTypes: Record<string, string[]> = {
  'action:email': ['send_email'],
  'event:email': ['reply_email', 'read_email'],
  'action:chat': ['send_chat'],
  'event:chat': ['reply_chat', 'read_chat', 'ignore_chat'],
  'event:document': ['open_document', 'close_document'],
  'event:call': ['start_call', 'finish_call'],
}

export function NodeConfigurationForm({ node, onSave, onDuplicate, onDelete }: { node: { node_name: string; node_type: string; configuration: Configuration }; onSave: (name: string, configuration: Configuration) => void; onDuplicate: () => void; onDelete: () => void }) {
  const [name, setName] = useState(node.node_name)
  const [configuration, setConfiguration] = useState<Configuration>(node.configuration)
  const nodeType: string = node.node_type
  const channel = String(configuration.channel ?? 'chat')
  const availableActions = actionTypes[`${nodeType}:${channel}`] ?? []
  const operation = String(configuration.action_type ?? availableActions[0] ?? '')
  const isCondition = nodeType === 'condition'
  const isTimer = nodeType === 'trigger' && configuration.trigger_type === 'timer'

  function change(values: Configuration) { setConfiguration((current) => ({ ...current, ...values })) }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const payload = availableActions.length && !configuration.action_type ? { ...configuration, action_type: availableActions[0] } : configuration; const errors = payload.action_type ? validateActionPayload(String(payload.action_type), payload) : []; if (errors.length) { window.alert(errors.join('\n')); return }; onSave(name, payload) }
  function selectChannel(value: string) {
    const nextActions = actionTypes[`${nodeType}:${value}`] ?? []
    setConfiguration((current) => ({ ...current, channel: value, action_type: nextActions[0] ?? undefined }))
  }

  return <form className="node-configuration-form" onSubmit={submit}><h2>Node configuration</h2><label>Name<input value={name} required onChange={(event) => setName(event.target.value)} /></label>{isCondition ? <ConditionEditor value={asConditionGroup(configuration)} onChange={(condition) => setConfiguration(condition as Configuration)} /> : <>{nodeType !== 'condition' && <label>Channel<select value={channel} onChange={(event) => selectChannel(event.target.value)}><option value="chat">chat</option><option value="email">email</option><option value="call">call</option><option value="document">document</option></select></label>}{availableActions.length > 0 && <label>Action type<select value={operation} onChange={(event) => change({ action_type: event.target.value })}>{availableActions.map((actionType) => <option key={actionType}>{actionType}</option>)}</select></label>}{operation === 'send_email' && <><TextField label="To" value={configuration.to} onChange={(to) => change({ to })} required /><TextField label="Subject" value={configuration.subject} onChange={(subject) => change({ subject })} required /></>}{operation === 'send_chat' && <TextField label="To" value={configuration.to} onChange={(to) => change({ to })} required />}{['reply_email', 'read_email'].includes(operation) && <TextField label="Email ID" value={configuration.email_id} onChange={(email_id) => change({ email_id })} required />}{['reply_chat', 'read_chat', 'ignore_chat'].includes(operation) && <TextField label="Chat ID" value={configuration.chat_id} onChange={(chat_id) => change({ chat_id })} required />}{['open_document', 'close_document'].includes(operation) && <><TextField label="Document ID" value={configuration.document_id} onChange={(document_id) => change({ document_id })} required />{operation === 'open_document' && <><TextField label="Document name" value={configuration.document_name} onChange={(document_name) => change({ document_name })} /><label><input type="checkbox" checked={Boolean(configuration.read_only)} onChange={(event) => change({ read_only: event.target.checked })} /> Read only</label></>}</>}{['start_call', 'finish_call'].includes(operation) && <TextField label="Call ID" value={configuration.call_id} onChange={(call_id) => change({ call_id })} required />}{['send_email', 'reply_email', 'send_chat', 'reply_chat'].includes(operation) && <label>Content<textarea value={String(configuration.content ?? '')} required onChange={(event) => change({ content: event.target.value })} /></label>}{nodeType === 'trigger' && <><label><input type="checkbox" checked={isTimer} onChange={(event) => change({ trigger_type: event.target.checked ? 'timer' : 'manual' })} /> Timer trigger</label>{isTimer && <label>Delay seconds<input type="number" min="0" value={Number(configuration.delay_seconds ?? 0)} onChange={(event) => change({ delay_seconds: Number(event.target.value) })} /></label>}</>}{nodeType === 'action' && <><label><input type="checkbox" checked={configuration.provider === 'dummy'} onChange={(event) => change({ provider: event.target.checked ? 'dummy' : undefined })} /> Dummy AI</label>{configuration.provider === 'dummy' && <label>AI operation<select value={String(configuration.operation ?? 'response')} onChange={(event) => change({ operation: event.target.value })}><option value="response">Response</option><option value="classification">Classification</option></select></label>}</>}<KeyValueEditor title="Metadata" value={asRecord(configuration.metadata)} onChange={(metadata) => change({ metadata })} /><KeyValueEditor title="Variables" value={asRecord(configuration.variables)} onChange={(variables) => change({ variables })} /></>}<button>Save node</button><button type="button" onClick={onDuplicate}>Duplicate node</button><button type="button" className="danger" onClick={onDelete}>Delete node</button></form>
}

export function EdgeConfigurationForm({ priority, condition, onSave, onDelete }: { priority: number; condition: Configuration | null; onSave: (priority: number, condition: Configuration | null) => void; onDelete: () => void }) {
  const [nextPriority, setPriority] = useState(priority)
  const [nextCondition, setCondition] = useState<ConditionGroup>(asConditionGroup(condition ?? {}))
  return <form className="node-configuration-form" onSubmit={(event) => { event.preventDefault(); onSave(nextPriority, nextCondition.conditions.length ? nextCondition as Configuration : null) }}><h2>Edge inspector</h2><label>Priority<input type="number" value={nextPriority} onChange={(event) => setPriority(Number(event.target.value))} /></label><ConditionEditor value={nextCondition} onChange={setCondition} /><button>Save edge</button><button type="button" className="danger" onClick={onDelete}>Delete edge</button></form>
}

function TextField({ label, value, onChange, required = false }: { label: string; value: unknown; onChange: (value: string) => void; required?: boolean }) { return <label>{label}<input required={required} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} /></label> }

function KeyValueEditor({ title, value, onChange }: { title: string; value: Record<string, unknown>; onChange: (value: Record<string, unknown>) => void }) {
  const entries = Object.entries(value)
  function update(index: number, key: string, entryValue: string) { const next = entries.filter((_, itemIndex) => itemIndex !== index); if (key) next.splice(index, 0, [key, entryValue]); onChange(Object.fromEntries(next)) }
  return <fieldset><legend>{title}</legend>{entries.map(([key, entryValue], index) => <div className="key-value" key={`${key}-${index}`}><input value={key} placeholder="Key" onChange={(event) => update(index, event.target.value, String(entryValue))} /><input value={String(entryValue)} placeholder="Value" onChange={(event) => update(index, key, event.target.value)} /><button type="button" onClick={() => update(index, '', '')}>Remove</button></div>)}<button type="button" onClick={() => onChange({ ...value, '': '' })}>Add field</button></fieldset>
}

function ConditionEditor({ value, onChange }: { value: ConditionGroup; onChange: (value: ConditionGroup) => void }) {
  function changeChild(index: number, child: ConditionItem) { const conditions = [...value.conditions]; conditions[index] = child; onChange({ ...value, conditions }) }
  function remove(index: number) { onChange({ ...value, conditions: value.conditions.filter((_, itemIndex) => itemIndex !== index) }) }
  return <fieldset className="condition-editor"><legend>Conditions</legend><label>Match<select value={value.operator} onChange={(event) => onChange({ ...value, operator: event.target.value as 'and' | 'or' })}><option value="and">ALL (AND)</option><option value="or">ANY (OR)</option></select></label>{value.conditions.map((child, index) => isGroup(child) ? <div className="nested-condition" key={index}><ConditionEditor value={child} onChange={(next) => changeChild(index, next)} /><button type="button" onClick={() => remove(index)}>Remove group</button></div> : <ConditionLeafEditor key={index} value={child} onChange={(next) => changeChild(index, next)} onRemove={() => remove(index)} />)}<div className="condition-actions"><button type="button" onClick={() => onChange({ ...value, conditions: [...value.conditions, { path: '', operator: 'equals', value: '' }] })}>Add rule</button><button type="button" onClick={() => onChange({ ...value, conditions: [...value.conditions, { operator: 'and', conditions: [] }] })}>Add group</button></div></fieldset>
}

function ConditionLeafEditor({ value, onChange, onRemove }: { value: ConditionLeaf; onChange: (value: ConditionLeaf) => void; onRemove: () => void }) { return <div className="condition-rule"><input value={value.path} placeholder="Payload path" onChange={(event) => onChange({ ...value, path: event.target.value })} /><select value={value.operator} onChange={(event) => onChange({ ...value, operator: event.target.value })}>{['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'contains', 'starts_with', 'ends_with', 'regex', 'exists'].map((operator) => <option key={operator}>{operator}</option>)}</select>{value.operator !== 'exists' && <input value={String(value.value ?? '')} placeholder="Value" onChange={(event) => onChange({ ...value, value: event.target.value })} />}<button type="button" onClick={onRemove}>Remove</button></div> }

function asConditionGroup(configuration: Configuration): ConditionGroup { if (configuration.operator === 'and' || configuration.operator === 'or') return { operator: configuration.operator, conditions: Array.isArray(configuration.conditions) ? configuration.conditions as ConditionItem[] : [] }; if (configuration.field || configuration.path) return { operator: 'and', conditions: [{ path: String(configuration.path ?? configuration.field), operator: legacyOperator(configuration), value: legacyValue(configuration) }] }; return { operator: 'and', conditions: [] } }
function legacyOperator(configuration: Configuration) { return ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'contains', 'starts_with', 'ends_with', 'regex', 'exists'].find((operator) => operator in configuration) ?? 'equals' }
function legacyValue(configuration: Configuration) { const operator = legacyOperator(configuration); return configuration[operator] ?? configuration.value ?? '' }
function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function isGroup(value: ConditionItem): value is ConditionGroup { return 'conditions' in value }
