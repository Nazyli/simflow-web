import { useEffect, useState, type FormEvent } from 'react'
import { useQueries } from '@tanstack/react-query'
import { getMasterData } from '../../shared/api/master-data'
import { inputClass, selectClass, textareaClass } from '../../shared/form-classes'

export const masterResources = [
  'actors',
  'simulations',
  'activities',
  'documents',
  'emails',
  'chats',
  'calls',
  'prompts',
  'scenarios',
  'designs',
  'levels',
  'scenario_activities',
] as const
export type MasterResource = (typeof masterResources)[number]

type Field = {
  name: string
  label: string
  required?: boolean
  type?: 'text' | 'textarea' | 'number' | 'boolean'
  relation?: MasterResource
  relationId?: string
  relationLabel?: string
}
type Definition = { id: string; fields: Field[] }

const definitions: Record<MasterResource, Definition> = {
  actors: {
    id: 'actor_id',
    fields: [
      text('actor_id', 'Actor ID', true),
      text('actor_name', 'Name', true),
      text('actor_email', 'Email'),
      text('actor_position', 'Position'),
      text('actor_group_position', 'Group position'),
      select('superior', 'Superior actor', 'actors', 'actor_id', 'actor_name'),
      select('design_id', 'Design', 'designs', 'design_id', 'design_name'),
      select('level_id', 'Level', 'levels', 'level_id', 'level_name'),
      area('persona_desc', 'Persona description'),
      flag('is_participant', 'Is participant'),
    ],
  },
  simulations: {
    id: 'simulation_id',
    fields: [
      text('simulation_id', 'Simulation ID', true),
      text('simulation_name', 'Name', true),
      area('simulation_desc', 'Description'),
      text('channel_name', 'Channel', true),
      number('duration', 'Duration (minutes)', true),
    ],
  },
  activities: {
    id: 'activity_id',
    fields: [
      text('activity_id', 'Activity ID', true),
      text('activity_name', 'Name'),
      area('activity_desc', 'Description'),
      select('simulation_id', 'Simulation', 'simulations', 'simulation_id', 'simulation_name'),
      select('level_id', 'Level', 'levels', 'level_id', 'level_name'),
      select('design_id', 'Design', 'designs', 'design_id', 'design_name'),
      text('ref_activity_type_id', 'Activity type ID'),
      text('state_name', 'State'),
      flag('is_first', 'First activity'),
    ],
  },
  documents: {
    id: 'document_id',
    fields: [
      text('document_id', 'Document ID', true),
      text('document_name', 'Name', true),
      text('folder_id', 'Folder ID'),
      select('activity_id', 'Activity', 'activities', 'activity_id', 'activity_name'),
      select('owner', 'Owner actor', 'actors', 'actor_id', 'actor_name'),
      text('read_only', 'Read only value'),
    ],
  },
  emails: {
    id: 'email_id',
    fields: [
      text('email_id', 'Email ID', true),
      text('email_name', 'Name', true),
      select('activity_id', 'Activity', 'activities', 'activity_id', 'activity_name', true),
      select('parent_activity_id', 'Parent activity', 'activities', 'activity_id', 'activity_name'),
      select('actor_from', 'From actor', 'actors', 'actor_id', 'actor_name', true),
      select('actor_to', 'To actor', 'actors', 'actor_id', 'actor_name', true),
      select('actor_cc', 'CC actor', 'actors', 'actor_id', 'actor_name'),
      text('email_type', 'Email type'),
      text('subject', 'Subject', true),
      area('content', 'Content'),
    ],
  },
  chats: {
    id: 'chat_id',
    fields: [
      text('chat_id', 'Chat ID', true),
      text('chat_name', 'Name', true),
      select('activity_id', 'Activity', 'activities', 'activity_id', 'activity_name'),
      select('actor_id', 'Actor', 'actors', 'actor_id', 'actor_name'),
      area('content', 'Content'),
    ],
  },
  calls: {
    id: 'call_id',
    fields: [
      text('call_id', 'Call ID', true),
      text('call_name', 'Name', true),
      select('activity_id', 'Activity', 'activities', 'activity_id', 'activity_name'),
      select('actor_id', 'Actor', 'actors', 'actor_id', 'actor_name'),
      area('content', 'Content'),
    ],
  },
  prompts: {
    id: 'prompt_id',
    fields: [
      text('prompt_id', 'Prompt ID', true),
      text('activity_type_id', 'Activity type ID'),
      select('simulation_id', 'Simulation', 'simulations', 'simulation_id', 'simulation_name'),
      area('content', 'Content'),
      area('desc', 'Description'),
    ],
  },
  scenarios: {
    id: 'scenario_id',
    fields: [
      text('scenario_id', 'Scenario ID', true),
      text('scenario_name', 'Name', true),
      area('scenario_desc', 'Description'),
      select('level_id', 'Level', 'levels', 'level_id', 'level_name'),
      select('design_id', 'Design', 'designs', 'design_id', 'design_name'),
      text('simulation_comp_id', 'Simulation competency ID'),
    ],
  },
  designs: {
    id: 'design_id',
    fields: [
      text('design_id', 'Design ID', true),
      text('design_name', 'Name', true),
      area('design_desc', 'Description'),
      area('design_background', 'Background'),
      area('design_background_md', 'Background (Markdown)'),
      area('instruction', 'Instruction'),
      area('instruction_md', 'Instruction (Markdown)'),
    ],
  },
  levels: {
    id: 'level_id',
    fields: [
      text('level_id', 'Level ID', true),
      text('level_name', 'Name', true),
      area('level_desc', 'Description'),
    ],
  },
  scenario_activities: {
    id: 'scenario_activity_id',
    fields: [
      text('scenario_activity_id', 'Scenario activity ID', true),
      select('activity_id', 'Activity', 'activities', 'activity_id', 'activity_name'),
      select(
        'triggered_activity_id',
        'Triggered activity',
        'activities',
        'activity_id',
        'activity_name',
      ),
      number('timer', 'Timer'),
      number('trigger_timer', 'Trigger timer'),
      text('status', 'Status'),
      select('actor_id', 'Actor', 'actors', 'actor_id', 'actor_name'),
      select('target_actor_id', 'Target actor', 'actors', 'actor_id', 'actor_name'),
      select('document_id', 'Document', 'documents', 'document_id', 'document_name'),
      select('prompt_id', 'Prompt', 'prompts', 'prompt_id', 'prompt_id'),
    ],
  },
}

function text(name: string, label: string, required = false): Field {
  return { name, label, required }
}
function area(name: string, label: string): Field {
  return { name, label, type: 'textarea' }
}
function number(name: string, label: string, required = false): Field {
  return { name, label, required, type: 'number' }
}
function flag(name: string, label: string): Field {
  return { name, label, type: 'boolean' }
}
function select(
  name: string,
  label: string,
  relation: MasterResource,
  relationId: string,
  relationLabel: string,
  required = false,
): Field {
  return { name, label, relation, relationId, relationLabel, required }
}

export function MasterDataForm({
  resource,
  record,
  onSave,
  onDelete,
  isSaving,
}: {
  resource: MasterResource
  record: Record<string, unknown> | null
  onSave: (id: string | null, values: Record<string, unknown>) => void
  onDelete: (id: string) => void
  isSaving: boolean
}) {
  const definition = definitions[resource]
  const [values, setValues] = useState<Record<string, unknown>>({})
  const relations = useQueries({
    queries: masterResources.map((item) => ({
      queryKey: ['master', item],
      queryFn: () => getMasterData(item),
      staleTime: 30_000,
    })),
  })
  const relatedRecords = Object.fromEntries(
    masterResources.map((item, index) => [item, relations[index].data ?? []]),
  ) as Partial<Record<MasterResource, Record<string, unknown>[]>>
  useEffect(() => {
    setValues(record ?? {})
  }, [record, resource])
  const isEditing = Boolean(record)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = isEditing ? String(record?.[definition.id]) : null
    onSave(id, values)
  }
  return (
    <form className="grid gap-3.5" onSubmit={submit}>
      {definition.fields.map((field) => (
        <label key={field.name} className="grid gap-1.5 text-xs font-semibold text-slate-700">
          {field.type === 'boolean' ? (
            <>
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#7c3aed]"
                checked={Boolean(values[field.name])}
                onChange={(event) => setValues({ ...values, [field.name]: event.target.checked })}
              />{' '}
              {field.label}
            </>
          ) : (
            <>
              {field.label}
              {field.relation ? (
                <select
                  required={field.required}
                  className={selectClass}
                  value={String(values[field.name] ?? '')}
                  onChange={(event) =>
                    setValues({ ...values, [field.name]: event.target.value || null })
                  }
                >
                  <option value="">Select {field.label}</option>
                  {relatedRecords[field.relation]?.map((item) => (
                    <option
                      key={String(item[field.relationId!])}
                      value={String(item[field.relationId!])}
                    >
                      {String(item[field.relationLabel!] ?? item[field.relationId!])}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  className={`${textareaClass} min-h-[72px]`}
                  value={String(values[field.name] ?? '')}
                  onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                />
              ) : (
                <input
                  className={inputClass}
                  type={field.type ?? 'text'}
                  required={field.required}
                  disabled={isEditing && field.name === definition.id}
                  value={String(values[field.name] ?? '')}
                  onChange={(event) =>
                    setValues({
                      ...values,
                      [field.name]:
                        field.type === 'number' ? Number(event.target.value) : event.target.value,
                    })
                  }
                />
              )}
            </>
          )}
        </label>
      ))}
      <div className="mt-1 flex flex-wrap gap-2">
        <button
          disabled={isSaving}
          className="rounded-lg bg-[#5b46c5] px-3.5 py-2 text-xs font-semibold text-white shadow-none transition hover:bg-[#4b38ac] disabled:opacity-50"
        >
          {isEditing ? 'Save changes' : 'Create record'}
        </button>
        {isEditing && (
          <button
            type="button"
            className="rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 shadow-none transition hover:bg-red-50 disabled:opacity-50"
            disabled={isSaving}
            onClick={() => onDelete(String(record?.[definition.id]))}
          >
            Delete record
          </button>
        )}
      </div>
    </form>
  )
}
