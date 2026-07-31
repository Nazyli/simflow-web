import { useEffect, useState, type FormEvent } from 'react'
import { Copy, Plus, Save, Sliders, Trash2, X, Sparkles, Tag, GitBranch, User, Clock, MessageSquare } from 'lucide-react'
import { validateActionPayload } from './action-composers'

type Configuration = Record<string, unknown>
type ConditionLeaf = { path: string; operator: string; value: unknown }
type ConditionGroup = { operator: 'and' | 'or'; conditions: ConditionItem[] }
type ConditionItem = ConditionLeaf | ConditionGroup

const actionTypes: Record<string, string[]> = {
  'action:email': ['send_email'],
  'event:email': ['reply_email', 'read_email'],
  'action:chat': ['send_chat'],
  'event:chat': ['read_chat', 'ignore_chat'],
  'event:document': ['open_document', 'close_document'],
  'event:call': ['start_call', 'finish_call'],
}

export function NodeConfigurationForm({ node, onSave, onDuplicate, onDelete }: { node: { node_name: string; node_type: string; configuration: Configuration }; onSave: (name: string, configuration: Configuration) => void; onDuplicate: () => void; onDelete: () => void }) {
  const [name, setName] = useState(node.node_name)
  const [configuration, setConfiguration] = useState<Configuration>(node.configuration)
  
  useEffect(() => {
    setName(node.node_name)
    setConfiguration(node.configuration)
  }, [node])

  const nodeType: string = node.node_type
  const channel = String(configuration.channel ?? 'chat')
  const availableActions = actionTypes[`${nodeType}:${channel}`] ?? []
  const operation = String(configuration.action_type ?? availableActions[0] ?? '')
  const isCondition = nodeType === 'condition'
  const isTimer = nodeType === 'trigger' && configuration.trigger_type === 'timer'
  const isDummyAI = configuration.provider === 'dummy'

  function change(values: Configuration) { setConfiguration((current) => ({ ...current, ...values })) }
  
  function submit(event: FormEvent<HTMLFormElement>) { 
    event.preventDefault()
    const payload = availableActions.length && !configuration.action_type ? { ...configuration, action_type: availableActions[0] } : configuration
    const errors = payload.action_type ? validateActionPayload(String(payload.action_type), payload) : []
    if (errors.length) { 
      window.alert(errors.join('\n'))
      return 
    }
    onSave(name, payload) 
  }

  function selectChannel(value: string) {
    const nextActions = actionTypes[`${nodeType}:${value}`] ?? []
    setConfiguration((current) => ({ ...current, channel: value, action_type: nextActions[0] ?? undefined }))
  }

  return (
    <form className="node-configuration-form flex flex-col gap-4" onSubmit={submit}>
      <div className="inspector-section-header">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-sm">Node Configuration</h3>
        </div>
        <span className={`node-type-badge ${nodeType}`}>{nodeType}</span>
      </div>

      {/* Node Name */}
      <div className="form-group">
        <label className="form-label">Node Name</label>
        <input 
          className="form-input" 
          value={name} 
          required 
          onChange={(event) => setName(event.target.value)} 
          placeholder="e.g. Process Order"
        />
      </div>

      {/* ── CONDITION NODE ── */}
      {isCondition ? (
        <>
          {/* Support flat-style condition (path / operator / value) from API */}
          <ConditionEditor value={asConditionGroup(configuration)} onChange={(condition) => setConfiguration(condition as Configuration)} />
        </>
      ) : (
        <>
          {/* ── TRIGGER NODE ── */}
          {nodeType === 'trigger' && (
            <div className="form-group card-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={isTimer} onChange={(event) => change({ trigger_type: event.target.checked ? 'timer' : 'manual' })} />
                <span className="font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-orange-500" /> Timer Trigger</span>
              </label>
              {isTimer && (
                <div className="mt-2">
                  <label className="form-label">Delay (seconds)</label>
                  <input className="form-input" type="number" min="0" value={Number(configuration.delay_seconds ?? 0)} onChange={(event) => change({ delay_seconds: Number(event.target.value) })} />
                </div>
              )}
            </div>
          )}

          {/* ── CHANNEL & ACTION TYPE (for action/event nodes) ── */}
          {nodeType !== 'trigger' && !isDummyAI && (
            <div className="form-group">
              <label className="form-label">Channel</label>
              <select className="form-select" value={channel} onChange={(event) => selectChannel(event.target.value)}>
                <option value="chat">Chat</option>
                <option value="email">Email</option>
                <option value="call">Call</option>
                <option value="document">Document</option>
              </select>
            </div>
          )}

          {!isDummyAI && availableActions.length > 0 && (
            <div className="form-group">
              <label className="form-label">Action Type</label>
              <select className="form-select" value={operation} onChange={(event) => change({ action_type: event.target.value })}>
                {availableActions.map((act) => <option key={act} value={act}>{act}</option>)}
              </select>
            </div>
          )}

          {/* ── FROM (actor ID sender) — action:chat / action:email ── */}
          {['send_chat', 'send_email'].includes(operation) && (
            <div className="form-group">
              <label className="form-label flex items-center gap-1"><User className="w-3.5 h-3.5 text-purple-500" /> From (Actor ID)</label>
              <input className="form-input" value={String(configuration.from ?? '')} onChange={(e) => change({ from: e.target.value })} placeholder="e.g. alexa-pmwm-ambj-01" />
            </div>
          )}

          {/* ── TO ── */}
          {['send_email'].includes(operation) && (
            <TextField label="To" value={configuration.to} onChange={(to) => change({ to })} required placeholder="recipient@example.com" />
          )}
          {['send_chat'].includes(operation) && (
            <TextField label="To (Participant ID)" value={configuration.to} onChange={(to) => change({ to })} required placeholder="demo-participant" />
          )}

          {/* ── EMAIL FIELDS ── */}
          {operation === 'send_email' && (
            <TextField label="Subject" value={configuration.subject} onChange={(subject) => change({ subject })} required placeholder="Email subject" />
          )}
          {['reply_email', 'read_email'].includes(operation) && (
            <TextField label="Email ID" value={configuration.email_id} onChange={(email_id) => change({ email_id })} required />
          )}

          {/* ── CHAT REPLY/READ FIELDS ── */}
          {['read_chat', 'ignore_chat'].includes(operation) && (
            <TextField label="Chat ID" value={configuration.chat_id} onChange={(chat_id) => change({ chat_id })} required />
          )}

          {/* ── DOCUMENT FIELDS ── */}
          {['open_document', 'close_document'].includes(operation) && (
            <>
              <TextField label="Document ID" value={configuration.document_id} onChange={(document_id) => change({ document_id })} required />
              {operation === 'open_document' && (
                <>
                  <TextField label="Document Name" value={configuration.document_name} onChange={(document_name) => change({ document_name })} />
                  <label className="checkbox-label">
                    <input type="checkbox" checked={Boolean(configuration.read_only)} onChange={(event) => change({ read_only: event.target.checked })} />
                    <span>Read only</span>
                  </label>
                </>
              )}
            </>
          )}

          {/* ── CALL FIELDS ── */}
          {['start_call', 'finish_call'].includes(operation) && (
            <TextField label="Call ID" value={configuration.call_id} onChange={(call_id) => change({ call_id })} required />
          )}

          {/* ── CONTENT (message body) ── */}
          {['send_email', 'reply_email', 'send_chat'].includes(operation) && (
            <div className="form-group">
              <label className="form-label flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Content</label>
              <textarea 
                className="form-textarea" 
                rows={3}
                value={String(configuration.content ?? '')} 
                required 
                onChange={(event) => change({ content: event.target.value })} 
                placeholder="Message content..."
              />
            </div>
          )}

          {/* ── AWAIT PARTICIPANT (action nodes that send messages) ── */}
          {nodeType === 'action' && ['send_chat', 'send_email'].includes(operation) && (
            <div className="form-group card-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={Boolean(configuration.await_participant)} onChange={(event) => change({ await_participant: event.target.checked })} />
                <span className="font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> Await Participant Reply</span>
              </label>
              {Boolean(configuration.await_participant) && (
                <div className="mt-2">
                  <label className="form-label">Timeout (seconds)</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    min="1"
                    value={Number(configuration.participant_timeout_seconds ?? 30)} 
                    onChange={(event) => change({ participant_timeout_seconds: Number(event.target.value) })} 
                    placeholder="e.g. 20"
                  />
                </div>
              )}
            </div>
          )}

          {/* ── EVENT NODE FIELDS ── */}
          {nodeType === 'event' && (
            <div className="form-group card-group flex flex-col gap-3">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={Boolean(configuration.consumes_participant_action)} 
                  onChange={(event) => change({ consumes_participant_action: event.target.checked })} 
                />
                <span className="font-medium">Consumes Participant Action</span>
              </label>

              {Boolean(configuration.consumes_participant_action) && (
                <div className="form-group">
                  <label className="form-label flex items-center gap-1"><User className="w-3.5 h-3.5 text-purple-500" /> Target Actor ID</label>
                  <input 
                    className="form-input" 
                    value={String(configuration.target_actor_id ?? '')} 
                    onChange={(e) => change({ target_actor_id: e.target.value })}
                    placeholder="e.g. alexa-pmwm-ambj-01"
                  />
                  <small className="text-xs text-slate-400 mt-0.5 block">Actor whose response this event captures</small>
                </div>
              )}
            </div>
          )}

          {/* ── DUMMY AI PROVIDER ── */}
          {nodeType === 'action' && (
            <div className="form-group card-group flex flex-col gap-3">
              <label className="checkbox-label">
                <input type="checkbox" checked={isDummyAI} onChange={(event) => change({ provider: event.target.checked ? 'dummy' : undefined, operation: event.target.checked ? 'classification' : undefined })} />
                <span className="flex items-center gap-1 font-medium"><Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Dummy AI Provider</span>
              </label>

              {isDummyAI && (
                <>
                  <div className="form-group">
                    <label className="form-label">AI Operation</label>
                    <select className="form-select" value={String(configuration.operation ?? 'classification')} onChange={(event) => change({ operation: event.target.value })}>
                      <option value="response">Response Generation</option>
                      <option value="classification">Classification</option>
                    </select>
                  </div>

                  {/* Classification fixture editor */}
                  {String(configuration.operation ?? 'classification') === 'classification' && (
                    <ClassificationFixtureEditor 
                      value={configuration.fixture as ClassificationFixture | undefined} 
                      onChange={(fixture) => change({ fixture })} 
                    />
                  )}
                </>
              )}
            </div>
          )}

          <KeyValueEditor title="Metadata" icon={<Tag className="w-3.5 h-3.5" />} value={asRecord(configuration.metadata)} onChange={(metadata) => change({ metadata })} />
          <KeyValueEditor title="Variables" icon={<Sliders className="w-3.5 h-3.5" />} value={asRecord(configuration.variables)} onChange={(variables) => change({ variables })} />
        </>
      )}

      <div className="inspector-actions">
        <button type="submit" className="btn-primary">
          <Save className="w-4 h-4" /> Save Node
        </button>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onDuplicate}>
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>
          <button type="button" className="btn-danger flex-1" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </form>
  )
}

export function EdgeConfigurationForm({ priority, onSave, onDelete }: { priority: number; onSave: (priority: number) => void; onDelete: () => void }) {
  const [nextPriority, setPriority] = useState(priority)

  useEffect(() => {
    setPriority(priority)
  }, [priority])

  return (
    <form className="node-configuration-form flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); onSave(nextPriority) }}>
      <div className="inspector-section-header">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-sm">Edge Inspector</h3>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Priority Order</label>
        <input className="form-input" type="number" value={nextPriority} onChange={(event) => setPriority(Number(event.target.value))} />
        <small className="text-xs text-slate-400 mt-0.5 block">Lower numbers execute first</small>
      </div>

      <div className="inspector-actions">
        <button type="submit" className="btn-primary">
          <Save className="w-4 h-4" /> Save Edge
        </button>
        <button type="button" className="btn-danger" onClick={onDelete}>
          <Trash2 className="w-4 h-4" /> Delete Edge
        </button>
      </div>
    </form>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function TextField({ label, value, onChange, required = false, placeholder }: { label: string; value: unknown; onChange: (value: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" required={required} placeholder={placeholder} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function KeyValueEditor({ title, icon, value, onChange }: { title: string; icon?: React.ReactNode; value: Record<string, unknown>; onChange: (value: Record<string, unknown>) => void }) {
  const entries = Object.entries(value)
  function update(index: number, key: string, entryValue: string) {
    const next = entries.filter((_, itemIndex) => itemIndex !== index)
    if (key) next.splice(index, 0, [key, entryValue])
    onChange(Object.fromEntries(next))
  }

  return (
    <fieldset className="key-value-fieldset">
      <legend className="flex items-center gap-1.5 font-medium text-xs text-slate-700">
        {icon} {title}
      </legend>
      {entries.map(([key, entryValue], index) => (
        <div className="key-value-row" key={`${key}-${index}`}>
          <input className="form-input text-xs" value={key} placeholder="Key" onChange={(event) => update(index, event.target.value, String(entryValue))} />
          <input className="form-input text-xs" value={String(entryValue)} placeholder="Value" onChange={(event) => update(index, key, event.target.value)} />
          <button type="button" className="icon-btn-danger" onClick={() => update(index, '', '')} title="Remove field">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost-sm mt-1" onClick={() => onChange({ ...value, '': '' })}>
        <Plus className="w-3.5 h-3.5" /> Add {title.toLowerCase()}
      </button>
    </fieldset>
  )
}

// ── Classification Fixture Editor ────────────────────────────────

type ClassificationLabel = { label: string; score: number }
type ClassificationFixture = { classifications: ClassificationLabel[] }

function ClassificationFixtureEditor({ value, onChange }: { value: ClassificationFixture | undefined; onChange: (v: ClassificationFixture) => void }) {
  const items: ClassificationLabel[] = value?.classifications ?? []

  function updateItem(index: number, field: 'label' | 'score', raw: string) {
    const next = items.map((item, i) => i === index ? { ...item, [field]: field === 'score' ? parseFloat(raw) || 0 : raw } : item)
    onChange({ classifications: next })
  }
  function addItem() { onChange({ classifications: [...items, { label: '', score: 0.9 }] }) }
  function removeItem(index: number) { onChange({ classifications: items.filter((_, i) => i !== index) }) }

  return (
    <fieldset className="key-value-fieldset">
      <legend className="flex items-center gap-1.5 font-medium text-xs text-slate-700">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Classification Labels
      </legend>
      {items.map((item, index) => (
        <div className="key-value-row" key={index}>
          <input className="form-input text-xs" value={item.label} placeholder="Label (e.g. Probing)" onChange={(e) => updateItem(index, 'label', e.target.value)} />
          <input className="form-input text-xs w-20" type="number" min="0" max="1" step="0.01" value={item.score} placeholder="Score" onChange={(e) => updateItem(index, 'score', e.target.value)} />
          <button type="button" className="icon-btn-danger" onClick={() => removeItem(index)} title="Remove label">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost-sm mt-1" onClick={addItem}>
        <Plus className="w-3.5 h-3.5" /> Add label
      </button>
    </fieldset>
  )
}

// ── Condition Editor ─────────────────────────────────────────────

function ConditionEditor({ value, onChange }: { value: ConditionGroup; onChange: (value: ConditionGroup) => void }) {
  function changeChild(index: number, child: ConditionItem) { 
    const conditions = [...value.conditions]
    conditions[index] = child
    onChange({ ...value, conditions }) 
  }
  function remove(index: number) { 
    onChange({ ...value, conditions: value.conditions.filter((_, itemIndex) => itemIndex !== index) }) 
  }

  return (
    <fieldset className="condition-editor">
      <legend className="font-medium text-xs text-slate-700">Transition Conditions</legend>
      <div className="form-group mb-2">
        <label className="form-label">Matching Logic</label>
        <select className="form-select" value={value.operator} onChange={(event) => onChange({ ...value, operator: event.target.value as 'and' | 'or' })}>
          <option value="and">Match ALL conditions (AND)</option>
          <option value="or">Match ANY condition (OR)</option>
        </select>
      </div>

      {value.conditions.map((child, index) => isGroup(child) ? (
        <div className="nested-condition" key={index}>
          <ConditionEditor value={child} onChange={(next) => changeChild(index, next)} />
          <button type="button" className="btn-ghost-danger text-xs mt-1" onClick={() => remove(index)}>
            <Trash2 className="w-3 h-3 inline mr-1" /> Remove group
          </button>
        </div>
      ) : (
        <ConditionLeafEditor key={index} value={child} onChange={(next) => changeChild(index, next)} onRemove={() => remove(index)} />
      ))}

      <div className="condition-actions flex gap-2 mt-2">
        <button type="button" className="btn-ghost-sm" onClick={() => onChange({ ...value, conditions: [...value.conditions, { path: '', operator: 'equals', value: '' }] })}>
          <Plus className="w-3.5 h-3.5" /> Add Rule
        </button>
        <button type="button" className="btn-ghost-sm" onClick={() => onChange({ ...value, conditions: [...value.conditions, { operator: 'and', conditions: [] }] })}>
          <Plus className="w-3.5 h-3.5" /> Add Group
        </button>
      </div>
    </fieldset>
  )
}

function ConditionLeafEditor({ value, onChange, onRemove }: { value: ConditionLeaf; onChange: (value: ConditionLeaf) => void; onRemove: () => void }) {
  return (
    <div className="condition-rule">
      <input className="form-input text-xs" value={value.path} placeholder="Payload path (e.g. data.status)" onChange={(event) => onChange({ ...value, path: event.target.value })} />
      <select className="form-select text-xs" value={value.operator} onChange={(event) => onChange({ ...value, operator: event.target.value })}>
        {['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'contains', 'starts_with', 'ends_with', 'regex', 'exists'].map((op) => (
          <option key={op} value={op}>{op}</option>
        ))}
      </select>
      {value.operator !== 'exists' && (
        <input className="form-input text-xs" value={String(value.value ?? '')} placeholder="Target value" onChange={(event) => onChange({ ...value, value: event.target.value })} />
      )}
      <button type="button" className="icon-btn-danger" onClick={onRemove} title="Remove rule">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────

function asConditionGroup(configuration: Configuration): ConditionGroup { 
  if (configuration.operator === 'and' || configuration.operator === 'or') return { operator: configuration.operator, conditions: Array.isArray(configuration.conditions) ? configuration.conditions as ConditionItem[] : [] }
  // Flat single-condition format from API: { path, operator, value }
  if (configuration.path || configuration.field) return { operator: 'and', conditions: [{ path: String(configuration.path ?? configuration.field ?? ''), operator: String(configuration.operator ?? 'equals'), value: configuration.value ?? '' }] }
  return { operator: 'and', conditions: [] } 
}
function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function isGroup(value: ConditionItem): value is ConditionGroup { return 'conditions' in value }
