import * as Dialog from '@radix-ui/react-dialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Database, Link2, Plus, TableProperties } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { createMasterData, deleteMasterData, getMasterData, updateMasterData } from '../../shared/api/master-data'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import { DataTable, type DataTableColumn } from '../../shared/components/data-table'
import { MasterDataForm, masterResources, type MasterResource } from '../simulation_studio/master-data-form'

const relationFields: Partial<Record<MasterResource, string[]>> = { actors: ['superior', 'design_id', 'level_id'], activities: ['simulation_id'], emails: ['actor_from', 'actor_to', 'activity_id'], chats: ['actor_id', 'activity_id'], calls: ['actor_id', 'activity_id'], documents: ['owner', 'activity_id'] }

export function MasterDataPage() {
  const client = useQueryClient()
  const [resource, setResource] = useState<MasterResource>('actors')
  const [record, setRecord] = useState<Record<string, unknown> | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Record<string, unknown>[]>([])
  const records = useQuery({ queryKey: ['master', resource], queryFn: () => getMasterData(resource) })
  const refresh = () => client.invalidateQueries({ queryKey: ['master', resource] })
  const close = () => { setDialogOpen(false); setRecord(null) }
  const create = useMutation({ mutationFn: (values: Record<string, unknown>) => createMasterData(resource, values), onSuccess: () => { refresh(); close(); toast.success('Record created.') }, onError: () => toast.error('Unable to create record.') })
  const update = useMutation({ mutationFn: ({ id, values }: { id: string; values: Record<string, unknown> }) => updateMasterData(resource, id, values), onSuccess: () => { refresh(); close(); toast.success('Record updated.') }, onError: () => toast.error('Unable to update record.') })
  const remove = useMutation({ mutationFn: (id: string) => deleteMasterData(resource, id), onSuccess: () => { refresh(); close(); toast.success('Record deleted.') }, onError: () => toast.error('Unable to delete record.') })
  const keys = Object.keys(records.data?.[0] ?? {}).filter((key) => !['is_deleted', 'created_date', 'modified_date'].includes(key)).slice(0, 5)
  const rows = (records.data ?? []).map((item, index) => ({ ...item, id: String(item[`${resource.slice(0, -1)}_id`] ?? index) }))
  const columns: DataTableColumn<Record<string, unknown> & { id: string }>[] = keys.map((key) => ({ id: key, header: key.replaceAll('_', ' '), cell: (row) => String(row[key] ?? '—'), sortValue: (row) => String(row[key] ?? ''), filterValue: (row) => String(row[key] ?? '') }))
  const relations = relationFields[resource] ?? []
  function openCreate() { setRecord(null); setDialogOpen(true) }
  function openEdit(row: Record<string, unknown>) { setRecord(row); setDialogOpen(true) }
  return <main className="master-data-page"><header><div><p className="eyebrow">Reference library</p><h1>Master Data</h1><p>Manage the entities and relationships that power every simulation.</p></div></header><section className="master-data-layout modern-master"><aside><h2>Resources</h2>{masterResources.map((item) => <button className={`workflow-item ${resource === item ? 'selected' : ''}`} key={item} onClick={() => { setResource(item); setSelected([]) }}>{item.replaceAll('_', ' ')}</button>)}</aside><section className="master-table-panel"><div className="table-title"><div><span className="table-icon"><TableProperties size={18} /></span><div><h2>{resource.replaceAll('_', ' ')}</h2><p>{rows.length} records available</p></div></div><button onClick={openCreate}><Plus size={15} /> Create record</button></div>{selected.length > 0 && <div className="bulk-toolbar">{selected.length} selected · Bulk actions are ready for the next operation.</div>}{records.isPending ? <LoadingState /> : records.isError ? <ErrorState message="Unable to load this resource." /> : rows.length === 0 ? <div className="master-empty"><Database size={26} /><strong>No records yet</strong><span>Create the first {resource.slice(0, -1)} to start building your simulation reference data.</span><button onClick={openCreate}>Create record</button></div> : <DataTable rows={rows} columns={[...columns, { id: 'edit', header: 'Actions', cell: (row) => <button onClick={() => openEdit(row)}>Edit</button> }]} onSelectionChange={setSelected} />}</section><aside className="relationship-preview"><h2><Link2 size={16} /> Relationship preview</h2>{relations.length ? <>{relations.map((field) => <div key={field}><small>{field.replaceAll('_', ' ')}</small><strong>{record?.[field] ? String(record[field]) : 'Select a record to inspect'}</strong></div>)}<p>Relations update as you select or edit a record.</p></> : <p>This resource has no direct relationship preview.</p>}</aside></section><Dialog.Root open={dialogOpen} onOpenChange={(open) => !open && close()}><Dialog.Portal><Dialog.Overlay className="command-overlay" /><Dialog.Content className="master-dialog"><Dialog.Title>{record ? 'Edit record' : 'Create record'}</Dialog.Title><Dialog.Description>Update structured simulation reference data.</Dialog.Description><MasterDataForm resource={resource} record={record} isSaving={create.isPending || update.isPending || remove.isPending} onSave={(id, values) => id ? update.mutate({ id, values }) : create.mutate(values)} onDelete={(id) => remove.mutate(id)} /></Dialog.Content></Dialog.Portal></Dialog.Root></main>
}
