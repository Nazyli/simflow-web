import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Ban,
  CheckCircle2,
  Hourglass,
  ListTree,
  PlayCircle,
  Route,
  Trash2,
  Layers,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../components/ui/dialog'
import { deleteExecution } from '../../shared/api/executions'
import { getExecutionHistory, type ExecutionHistoryItem } from '../../shared/api/sessions'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import { DataTable, type DataTableColumn } from '../../shared/components/data-table'
import { StatusBadge } from '../../shared/components/status-badge'

interface HistoryRow {
  id: string
  execution: ExecutionHistoryItem
  simulationName: string
  versionNumber: number | null
}

const HISTORY_STATUSES = ['pending', 'running', 'waiting', 'completed', 'failed', 'cancelled']

function effectiveStatus(row: HistoryRow) {
  return row.execution?.status ?? 'pending'
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
    <Layers size={18} />
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
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<HistoryRow | null>(null)
  const history = useQuery({
    queryKey: ['participant-history'],
    queryFn: async (): Promise<HistoryRow[]> => {
      const executions = await getExecutionHistory()
      return executions.map((execution) => ({
        id: execution.execution_id,
        execution,
          simulationName: execution.group_simulation_name ?? 'Simulation unavailable',
        versionNumber: execution.version_number,
      }))
    },
  })
  const removeExecution = useMutation({
    mutationFn: deleteExecution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant-history'] })
      setDeleteTarget(null)
      toast.success('Execution log deleted.')
    },
    onError: () => toast.error('Unable to delete the execution log.'),
  })
  const rows = useMemo(
    () => (history.data ?? []).filter((row): row is HistoryRow & { execution: ExecutionHistoryItem } => Boolean(row.execution)),
    [history.data],
  )
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
      id: 'simulation',
      header: 'Simulation',
      cell: (row) => (
        <span
          className="block max-w-48 truncate font-medium text-slate-800"
          title={row.simulationName}
        >
          {row.simulationName}
        </span>
      ),
      filterValue: (row) => row.simulationName,
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
          {new Date(
            /(?:[zZ]$|[+-]\d{2}:?\d{2}$)/.test(row.execution.started_at ?? row.execution.created_at)
              ? row.execution.started_at ?? row.execution.created_at
              : `${row.execution.started_at ?? row.execution.created_at}Z`,
          ).toLocaleString([], { timeZone: 'Asia/Jakarta' })}
        </time>
      ),
      sortValue: (row) => row.execution.started_at ?? row.execution.created_at,
    },
    {
      id: 'completed',
      header: 'Completed at',
      cell: (row) => {
        const val = row.execution.completed_at
        const parsed = val
          ? new Date(/(?:[zZ]$|[+-]\d{2}:?\d{2}$)/.test(val) ? val : `${val}Z`)
          : null
        return (
          <time className="text-xs text-slate-700 tabular-nums" dateTime={val ?? ''}>
            {parsed ? parsed.toLocaleString([], { timeZone: 'Asia/Jakarta' }) : '—'}
          </time>
        )
      },
      sortValue: (row) => row.execution.completed_at ?? '',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => navigate(`/history/${row.execution.execution_id}`)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-none transition hover:bg-slate-50"
          >
            <ListTree size={12} className="mr-1 inline" />
            Detail
          </button>
          <button
            onClick={() => navigate(`/history/${row.execution.execution_id}?tab=flow`)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-none transition hover:bg-slate-50"
          >
            <Route size={12} className="mr-1 inline" />
            Flow
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            aria-label={`Delete execution ${row.execution.execution_id}`}
            title="Delete execution log"
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-none transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={12} />
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
            <Layers size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-purple-700 uppercase">
              Observability
            </p>
            <h1 className="truncate text-lg font-bold text-slate-900">
              Simulation execution history
            </h1>
            <p className="truncate text-xs text-slate-500">
              Every simulation execution across simulation sessions.
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
            No simulation executions yet.
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="p-6 sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Trash2 className="h-5 w-5 text-red-600" /> Delete execution log?
          </DialogTitle>
          <DialogDescription>
            This permanently deletes the execution, its timeline events, node results, waits,
            timers, and the simulation session when no other execution uses it. This cannot be
            undone.
          </DialogDescription>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={removeExecution.isPending}
              onClick={() => deleteTarget && removeExecution.mutate(deleteTarget.execution.execution_id)}
              className="border-0 bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />{' '}
              {removeExecution.isPending ? 'Deleting…' : 'Delete log'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
