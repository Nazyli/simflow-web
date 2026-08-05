import { useQuery } from '@tanstack/react-query'
import { Ban, CheckCircle2, Hourglass, ListTree, PlayCircle, Route, Workflow, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { getExecution, getNodeExecutions, type NodeExecution } from '../../shared/api/executions'
import { getSessions, type SimulationSessionSummary } from '../../shared/api/sessions'
import { getWorkflowVersion } from '../../shared/api/workflows'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import { DataTable, type DataTableColumn } from '../../shared/components/data-table'
import { StatusBadge } from '../../shared/components/status-badge'
import type { Execution } from '../../shared/types/workflow'
import { ParticipantFlowView } from './participant-flow-view'

interface HistoryRow {
  id: string
  session: SimulationSessionSummary
  execution: Execution | null
  workflowName: string
  versionNumber: number | null
}

const HISTORY_STATUSES = ['active', 'running', 'waiting', 'completed', 'failed', 'cancelled']

const JAKARTA = 'Asia/Jakarta'
function parseServerTime(value: string | null | undefined) { return value ? new Date(/(?:[zZ]$|[+-]\d{2}:?\d{2}$)/.test(value) ? value : `${value}Z`) : null }
function formatTime(value: string | null | undefined) { const parsed = parseServerTime(value); return parsed ? parsed.toLocaleString([], { timeZone: JAKARTA }) : '—' }
function effectiveStatus(row: HistoryRow) { return row.execution?.status ?? row.session.status }

const STATUS_TONES: Record<string, string> = {
  active: 'bg-blue-50 text-blue-600',
  running: 'bg-indigo-50 text-indigo-600',
  waiting: 'bg-amber-50 text-amber-600',
  completed: 'bg-emerald-50 text-emerald-600',
  failed: 'bg-red-50 text-red-600',
  cancelled: 'bg-slate-100 text-slate-500',
  total: 'bg-purple-50 text-[#5b46c5]',
}

function StatusIcon({ status }: { status: string }) { return status === 'failed' ? <XCircle size={18} /> : status === 'completed' ? <CheckCircle2 size={18} /> : status === 'cancelled' ? <Ban size={18} /> : status === 'waiting' ? <Hourglass size={18} /> : status === 'active' || status === 'running' ? <PlayCircle size={18} /> : <Workflow size={18} /> }

function StatCard({ status, count }: { status: string; count: number }) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${STATUS_TONES[status] ?? STATUS_TONES.total}`}>
        <StatusIcon status={status} />
      </span>
      <div className="min-w-0">
        <small className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{status === 'total' ? 'All sessions' : status}</small>
        <strong className="block text-xl font-bold leading-tight text-slate-900 tabular-nums">{count}</strong>
      </div>
    </article>
  )
}

export function ParticipantHistoryPage() {
  const [selectedRow, setSelectedRow] = useState<HistoryRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [flowOpen, setFlowOpen] = useState(false)
  const history = useQuery({
    queryKey: ['participant-history'],
    queryFn: async (): Promise<HistoryRow[]> => {
      const sessions = await getSessions()
      return Promise.all(sessions.map(async (session): Promise<HistoryRow> => {
        const row = { id: session.session_id, session, execution: null, workflowName: 'No execution', versionNumber: null }
        if (!session.execution_id) return row
        const execution = await getExecution(session.execution_id)
        try {
          const version = await getWorkflowVersion(execution.workflow_version_id)
          return { ...row, execution, workflowName: version.workflow_name, versionNumber: version.version_number }
        } catch {
          return { ...row, execution, workflowName: 'Workflow unavailable' }
        }
      }))
    },
  })
  const nodeExecutions = useQuery({
    queryKey: ['history-node-executions', selectedRow?.execution?.execution_id],
    queryFn: () => getNodeExecutions(selectedRow!.execution!.execution_id),
    enabled: detailOpen && Boolean(selectedRow?.execution),
  })
  const rows = useMemo(() => history.data ?? [], [history.data])
  const counts = useMemo(() => [...HISTORY_STATUSES.map((status) => ({ status, count: rows.filter((row) => effectiveStatus(row) === status).length })), { status: 'total', count: rows.length }], [rows])
  const columns: DataTableColumn<HistoryRow>[] = [
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={effectiveStatus(row)} />, sortValue: (row) => effectiveStatus(row) },
    { id: 'participant', header: 'Participant ID', cell: (row) => <span className="block max-w-[150px] truncate font-mono text-xs text-slate-700" title={row.session.participant_id}>{row.session.participant_id}</span>, filterValue: (row) => row.session.participant_id },
    { id: 'session', header: 'Session ID', cell: (row) => <span className="block max-w-44 truncate font-mono text-xs text-slate-700" title={row.session.session_id}>{row.session.session_id}</span>, filterValue: (row) => row.session.session_id },
    { id: 'workflow', header: 'Workflow', cell: (row) => <span className="block max-w-48 truncate font-medium text-slate-800" title={row.workflowName}>{row.workflowName}</span>, filterValue: (row) => row.workflowName },
    { id: 'version', header: 'Version', cell: (row) => <span className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 tabular-nums">v{row.versionNumber ?? '—'}</span>, sortValue: (row) => row.versionNumber ?? 0 },
    { id: 'started', header: 'Started at', cell: (row) => <time className="text-xs text-slate-700 tabular-nums" dateTime={row.session.created_at}>{formatTime(row.execution?.started_at ?? row.session.created_at)}</time>, sortValue: (row) => row.execution?.started_at ?? row.session.created_at },
    { id: 'completed', header: 'Completed at', cell: (row) => <time className="text-xs text-slate-700 tabular-nums" dateTime={row.session.completed_at ?? ''}>{formatTime(row.execution?.completed_at ?? row.session.completed_at)}</time>, sortValue: (row) => row.execution?.completed_at ?? row.session.completed_at ?? '' },
    { id: 'actions', header: 'Actions', cell: (row) => (
      <div className="flex items-center justify-end gap-1.5">
        <button onClick={() => { setSelectedRow(row); setDetailOpen(true) }} disabled={!row.execution} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-none transition hover:bg-slate-50 disabled:opacity-50"><ListTree size={12} className="mr-1 inline" />Detail</button>
        <button onClick={() => { setSelectedRow(row); setFlowOpen(true) }} disabled={!row.execution} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-none transition hover:bg-slate-50 disabled:opacity-50"><Route size={12} className="mr-1 inline" />Flow</button>
      </div>
    ) },
  ]

  return (
    <main className="history-page min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-sm"><Workflow size={18} /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Observability</p>
            <h1 className="truncate text-lg font-bold text-slate-900">Workflow execution history</h1>
            <p className="truncate text-xs text-slate-500">All simulation sessions and their latest workflow executions.</p>
          </div>
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {counts.map(({ status, count }) => <StatCard key={status} status={status} count={count} />)}
      </section>

      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {history.isPending ? <LoadingState /> : history.isError ? <ErrorState message="Unable to load execution history." /> : rows.length ? <DataTable rows={rows} columns={columns} selectable={false} /> : <div className="px-5 py-10 text-center text-sm text-slate-500">No simulation sessions yet.</div>}
      </section>

      <NodeExecutionDialog open={detailOpen} onClose={() => setDetailOpen(false)} row={selectedRow} nodeExecutions={nodeExecutions.data ?? []} loading={nodeExecutions.isPending} />
      <ParticipantFlowView open={flowOpen} onClose={() => setFlowOpen(false)} versionId={selectedRow?.execution?.workflow_version_id ?? ''} executionId={selectedRow?.execution?.execution_id ?? ''} title={selectedRow ? `${selectedRow.workflowName} · v${selectedRow.versionNumber ?? '—'}` : 'Participant flow'} currentState={selectedRow?.execution?.current_node_id ?? null} />
    </main>
  )
}

function NodeExecutionDialog({ open, onClose, row, nodeExecutions, loading }: { open: boolean; onClose: () => void; row: HistoryRow | null; nodeExecutions: NodeExecution[]; loading: boolean }) {
  return <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="max-w-4xl p-6">
      <DialogTitle className="text-base font-bold text-slate-900">Workflow node execution history</DialogTitle>
      <DialogDescription>{row ? `${row.workflowName} · ${row.session.session_id}` : 'Node execution details'}</DialogDescription>
      {loading ? <LoadingState /> : <div className="max-h-[55vh] overflow-auto rounded-lg border border-slate-200">
        <Table>
          <TableHeader><TableRow><TableHead>Sequence</TableHead><TableHead>Node ID</TableHead><TableHead>Status</TableHead><TableHead>Selected port</TableHead><TableHead>Output</TableHead></TableRow></TableHeader>
          <TableBody>{nodeExecutions.map((item) => <TableRow key={item.node_execution_id}>
            <TableCell>{item.sequence_number}</TableCell><TableCell className="font-mono text-xs">{item.node_id}</TableCell><TableCell><StatusBadge status={item.status} /></TableCell><TableCell className="font-mono text-xs">{item.selected_port ?? '—'}</TableCell><TableCell className="max-w-72 truncate font-mono text-xs" title={JSON.stringify(item.output_data ?? {})}>{JSON.stringify(item.output_data ?? {})}</TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </div>}
      <div className="flex justify-end"><DialogClose asChild><Button variant="outline" size="sm">Close</Button></DialogClose></div>
    </DialogContent>
  </Dialog>
}
