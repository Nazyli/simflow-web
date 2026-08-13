import { useQuery } from '@tanstack/react-query'
import {
  Ban,
  Check,
  CheckCircle2,
  Copy,
  Hourglass,
  ListTree,
  PlayCircle,
  Route,
  Workflow,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { getNodeExecutions, type NodeExecution } from '../../shared/api/executions'
import { getExecutionHistory, type ExecutionHistoryItem } from '../../shared/api/sessions'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import { DataTable, type DataTableColumn } from '../../shared/components/data-table'
import { StatusBadge } from '../../shared/components/status-badge'
import { ParticipantFlowView } from './participant-flow-view'

interface HistoryRow {
  id: string
  execution: ExecutionHistoryItem
  workflowName: string
  versionNumber: number | null
}

const HISTORY_STATUSES = ['pending', 'running', 'waiting', 'completed', 'failed', 'cancelled']

const JAKARTA = 'Asia/Jakarta'
function parseServerTime(value: string | null | undefined) {
  return value ? new Date(/(?:[zZ]$|[+-]\d{2}:?\d{2}$)/.test(value) ? value : `${value}Z`) : null
}
function formatTime(value: string | null | undefined) {
  const parsed = parseServerTime(value)
  return parsed ? parsed.toLocaleString([], { timeZone: JAKARTA }) : '—'
}
function effectiveStatus(row: HistoryRow) {
  return row.execution.status
}

const STATUS_TONES: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-500',
  running: 'bg-indigo-50 text-indigo-600',
  waiting: 'bg-amber-50 text-amber-600',
  completed: 'bg-emerald-50 text-emerald-600',
  failed: 'bg-red-50 text-red-600',
  cancelled: 'bg-slate-100 text-slate-500',
  total: 'bg-purple-50 text-[#5b46c5]',
}

function StatusIcon({ status }: { status: string }) {
  return status === 'failed' ? (
    <XCircle size={18} />
  ) : status === 'completed' ? (
    <CheckCircle2 size={18} />
  ) : status === 'cancelled' ? (
    <Ban size={18} />
  ) : status === 'waiting' ? (
    <Hourglass size={18} />
  ) : status === 'active' || status === 'running' ? (
    <PlayCircle size={18} />
  ) : (
    <Workflow size={18} />
  )
}

function StatCard({ status, count }: { status: string; count: number }) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${STATUS_TONES[status] ?? STATUS_TONES.total}`}
      >
        <StatusIcon status={status} />
      </span>
      <div className="min-w-0">
        <small className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          {status === 'total' ? 'All executions' : status}
        </small>
        <strong className="block text-xl leading-tight font-bold text-slate-900 tabular-nums">
          {count}
        </strong>
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
      const executions = await getExecutionHistory()
      return executions.map((execution) => ({
        id: execution.execution_id,
        execution,
        workflowName: execution.workflow_name ?? 'Workflow unavailable',
        versionNumber: execution.version_number,
      }))
    },
  })
  const nodeExecutions = useQuery({
    queryKey: ['history-node-executions', selectedRow?.execution.execution_id],
    queryFn: () => getNodeExecutions(selectedRow!.execution.execution_id),
    enabled: detailOpen && Boolean(selectedRow?.execution.execution_id),
  })
  const rows = useMemo(() => history.data ?? [], [history.data])
  const counts = useMemo(
    () => [
      ...HISTORY_STATUSES.map((status) => ({
        status,
        count: rows.filter((row) => effectiveStatus(row) === status).length,
      })),
      { status: 'total', count: rows.length },
    ],
    [rows],
  )
  const columns: DataTableColumn<HistoryRow>[] = [
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={effectiveStatus(row)} />,
      sortValue: (row) => effectiveStatus(row),
    },
    {
      id: 'participant',
      header: 'Participant ID',
      cell: (row) => (
        <span
          className="block max-w-[150px] truncate font-mono text-xs text-slate-700"
          title={row.execution.participant_id}
        >
          {row.execution.participant_id}
        </span>
      ),
      filterValue: (row) => row.execution.participant_id,
    },
    {
      id: 'session',
      header: 'Session ID',
      cell: (row) => (
        <span
          className="block max-w-44 truncate font-mono text-xs text-slate-700"
          title={row.execution.session_id}
        >
          {row.execution.session_id}
        </span>
      ),
      filterValue: (row) => row.execution.session_id,
    },
    {
      id: 'workflow',
      header: 'Workflow',
      cell: (row) => (
        <span
          className="block max-w-48 truncate font-medium text-slate-800"
          title={row.workflowName}
        >
          {row.workflowName}
        </span>
      ),
      filterValue: (row) => row.workflowName,
    },
    {
      id: 'version',
      header: 'Version',
      cell: (row) => (
        <span className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 tabular-nums">
          v{row.versionNumber ?? '—'}
        </span>
      ),
      sortValue: (row) => row.versionNumber ?? 0,
    },
    {
      id: 'started',
      header: 'Started at',
      cell: (row) => (
        <time
          className="text-xs text-slate-700 tabular-nums"
          dateTime={row.execution.started_at ?? row.execution.created_at}
        >
          {formatTime(row.execution.started_at ?? row.execution.created_at)}
        </time>
      ),
      sortValue: (row) => row.execution.started_at ?? row.execution.created_at,
    },
    {
      id: 'completed',
      header: 'Completed at',
      cell: (row) => (
        <time
          className="text-xs text-slate-700 tabular-nums"
          dateTime={row.execution.completed_at ?? ''}
        >
          {formatTime(row.execution.completed_at)}
        </time>
      ),
      sortValue: (row) => row.execution.completed_at ?? '',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedRow(row)
              setDetailOpen(true)
            }}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-none transition hover:bg-slate-50"
          >
            <ListTree size={12} className="mr-1 inline" />
            Detail
          </button>
          <button
            onClick={() => {
              setSelectedRow(row)
              setFlowOpen(true)
            }}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-none transition hover:bg-slate-50"
          >
            <Route size={12} className="mr-1 inline" />
            Flow
          </button>
        </div>
      ),
    },
  ]

  return (
    <main className="history-page min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-sm">
            <Workflow size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-purple-700 uppercase">
              Observability
            </p>
            <h1 className="truncate text-lg font-bold text-slate-900">
              Workflow execution history
            </h1>
            <p className="truncate text-xs text-slate-500">
              Every workflow execution across simulation sessions.
            </p>
          </div>
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {counts.map(({ status, count }) => (
          <StatCard key={status} status={status} count={count} />
        ))}
      </section>

      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {history.isPending ? (
          <LoadingState />
        ) : history.isError ? (
          <ErrorState message="Unable to load execution history." />
        ) : rows.length ? (
          <DataTable rows={rows} columns={columns} selectable={false} />
        ) : (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No workflow executions yet.
          </div>
        )}
      </section>

      <NodeExecutionDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        row={selectedRow}
        nodeExecutions={nodeExecutions.data ?? []}
        loading={nodeExecutions.isPending}
      />
      <ParticipantFlowView
        open={flowOpen}
        onClose={() => setFlowOpen(false)}
        versionId={selectedRow?.execution.workflow_version_id ?? ''}
        executionId={selectedRow?.execution.execution_id ?? ''}
        title={
          selectedRow
            ? `${selectedRow.workflowName} · v${selectedRow.versionNumber ?? '—'}`
            : 'Participant flow'
        }
        currentState={selectedRow?.execution.current_node_id ?? null}
      />
    </main>
  )
}

function NodeExecutionDialog({
  open,
  onClose,
  row,
  nodeExecutions,
  loading,
}: {
  open: boolean
  onClose: () => void
  row: HistoryRow | null
  nodeExecutions: NodeExecution[]
  loading: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-[min(94vw,80rem)] p-6 sm:max-w-[min(94vw,80rem)]">
        <DialogTitle className="text-base font-bold text-slate-900">
          Workflow node execution history
        </DialogTitle>
        <DialogDescription>
          {row ? `${row.workflowName} · ${row.execution.session_id}` : 'Node execution details'}
        </DialogDescription>
        {loading ? (
          <LoadingState />
        ) : nodeExecutions.length ? (
          <div className="max-h-[62vh] overflow-auto rounded-lg border border-slate-200">
            <Table>
              <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-1 [&_th]:bg-slate-50 [&_th]:text-[0.66rem] [&_th]:font-bold [&_th]:tracking-[0.06em] [&_th]:uppercase">
                <TableRow>
                  <TableHead>Sequence</TableHead>
                  <TableHead>Node ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Selected</TableHead>
                  <TableHead>Output</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodeExecutions.map((item) => (
                  <TableRow key={item.node_execution_id} className="align-top">
                    <TableCell className="font-mono text-xs text-slate-600 tabular-nums">
                      {item.sequence_number}
                    </TableCell>
                    <TableCell className="max-w-56 font-mono text-xs break-all whitespace-normal text-slate-700">
                      {item.node_id}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      {item.selected_port ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex rounded-md bg-violet-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-violet-700">
                            {item.selected_port}
                          </span>
                          {item.selected_edge_id && (
                            <span
                              className="max-w-44 truncate font-mono text-[10px] text-slate-400"
                              title={item.selected_edge_id}
                            >
                              {item.selected_edge_id}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <JsonCell value={item.output_data} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
            No node executions recorded.
          </div>
        )}
        <div className="flex justify-end">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function JsonCell({ value }: { value: Record<string, unknown> | null }) {
  const text = JSON.stringify(value ?? {}, null, 2)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <div className="relative min-w-[260px]">
      <button
        onClick={copy}
        className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-md bg-slate-700/80 text-slate-200 transition hover:bg-slate-600"
        title="Copy output"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
      <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 pr-9 font-mono text-[11px] leading-relaxed text-slate-100">
        {text}
      </pre>
    </div>
  )
}
