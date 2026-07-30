import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createMasterData, deleteMasterData, getMasterData, updateMasterData } from '../../shared/api/master-data'
import { DataTable, type DataTableColumn } from '../../shared/components/data-table'
import { LoadingState } from '../../shared/components/async-state'
import { MasterDataForm, masterResources, type MasterResource } from '../simulation_studio/master-data-form'

export function MasterDataPage() {
  const client = useQueryClient(); const [resource, setResource] = useState<MasterResource>('actors'); const [record, setRecord] = useState<Record<string, unknown> | null>(null)
  const records = useQuery({ queryKey: ['master', resource], queryFn: () => getMasterData(resource) })
  const refresh = () => client.invalidateQueries({ queryKey: ['master', resource] })
  const create = useMutation({ mutationFn: (values: Record<string, unknown>) => createMasterData(resource, values), onSuccess: () => { setRecord(null); refresh() } })
  const update = useMutation({ mutationFn: ({ id, values }: { id: string; values: Record<string, unknown> }) => updateMasterData(resource, id, values), onSuccess: refresh })
  const remove = useMutation({ mutationFn: (id: string) => deleteMasterData(resource, id), onSuccess: () => { setRecord(null); refresh() } })
  const keys = Object.keys(records.data?.[0] ?? {}).filter((key) => !['is_deleted', 'created_date', 'modified_date'].includes(key)).slice(0, 5)
  const columns: DataTableColumn<Record<string, unknown> & { id: string }>[] = keys.map((key) => ({ id: key, header: key.replaceAll('_', ' '), cell: (row) => String(row[key] ?? '—'), filterValue: (row) => String(row[key] ?? '') }))
  const rows = (records.data ?? []).map((item, index) => ({ ...item, id: String(item[`${resource.slice(0, -1)}_id`] ?? index) }))
  return <main className="master-data-page"><header><div><h1>Master Data</h1><p>Manage actors, channels, documents, scenarios, and related reference data.</p></div><Link to="/studio">Open Studio</Link></header><section className="master-data-layout"><aside><h2>Resources</h2>{masterResources.map((item) => <button className={`workflow-item ${resource === item ? 'selected' : ''}`} key={item} onClick={() => { setResource(item); setRecord(null) }}>{item.replaceAll('_', ' ')}</button>)}</aside><section><div className="toolbar"><h2>{resource.replaceAll('_', ' ')}</h2><button onClick={() => setRecord(null)}>Create record</button></div>{records.isPending ? <LoadingState /> : <DataTable rows={rows} columns={[...columns, { id: 'edit', header: 'Edit', cell: (row) => <button onClick={() => setRecord(row)}>Edit</button> }]} />}</section><aside><MasterDataForm resource={resource} record={record} isSaving={create.isPending || update.isPending || remove.isPending} onSave={(id, values) => id ? update.mutate({ id, values }) : create.mutate(values)} onDelete={(id) => remove.mutate(id)} /></aside></section></main>
}
