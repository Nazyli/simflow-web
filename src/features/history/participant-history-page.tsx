import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ListTree, Route, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { PageFrame } from '../../components/layout/page-frame'
import { PageHeader } from '../../components/layout/page-header'
import { SummaryStrip } from '../../components/layout/summary-strip'
import { SurfaceSection } from '../../components/layout/surface-section'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../components/ui/dialog'
import { deleteExecution } from '../../shared/api/executions'
import { getExecutionHistory, type ExecutionHistoryItem } from '../../shared/api/sessions'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import { DataTable, type DataTableColumn } from '../../shared/components/data-table'
import { StatusBadge } from '../../shared/components/status-badge'

interface HistoryRow {
  id: string
  execution: ExecutionHistoryItem
  simulationName: string
  simulationVersionName: string | null
}

const HISTORY_STATUSES = ['pending', 'running', 'waiting', 'completed', 'failed', 'cancelled']

function effectiveStatus(row: HistoryRow) {
  return row.execution?.status ?? 'pending'
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
        id: execution.executionId,
        execution,
        simulationName: execution.groupSimulationName ?? 'Simulation unavailable',
        simulationVersionName: execution.simulationName,
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
    () =>
      (history.data ?? []).filter((row): row is HistoryRow & { execution: ExecutionHistoryItem } =>
        Boolean(row.execution),
      ),
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
  const summaryItems = counts.map(({ status, count }) => ({
    label: status === 'total' ? 'All executions' : status,
    value: count,
    tone:
      status === 'completed'
        ? ('success' as const)
        : status === 'failed'
          ? ('danger' as const)
          : status === 'waiting'
            ? ('warning' as const)
            : status === 'running'
              ? ('accent' as const)
              : ('neutral' as const),
  }))
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
          title={row.execution.participantId}
        >
          {row.execution.participantId}
        </span>
      ),
      filterValue: (row) => row.execution.participantId,
    },
    {
      id: 'session',
      header: 'Session ID',
      cell: (row) => (
        <span
          className="block max-w-44 truncate font-mono text-xs text-slate-700"
          title={row.execution.sessionId}
        >
          {row.execution.sessionId}
        </span>
      ),
      filterValue: (row) => row.execution.sessionId,
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
          {row.simulationVersionName ?? '—'}
        </span>
      ),
      sortValue: (row) => row.simulationVersionName ?? '',
    },
    {
      id: 'started',
      header: 'Started at',
      cell: (row) => (
        <time
          className="text-xs text-slate-700 tabular-nums"
          dateTime={row.execution.startedAt ?? row.execution.createdAt}
        >
          {new Date(
            /(?:[zZ]$|[+-]\d{2}:?\d{2}$)/.test(row.execution.startedAt ?? row.execution.createdAt)
              ? (row.execution.startedAt ?? row.execution.createdAt)
              : `${row.execution.startedAt ?? row.execution.createdAt}Z`,
          ).toLocaleString([], { timeZone: 'Asia/Jakarta' })}
        </time>
      ),
      sortValue: (row) => row.execution.startedAt ?? row.execution.createdAt,
    },
    {
      id: 'completed',
      header: 'Completed at',
      cell: (row) => {
        const val = row.execution.completedAt
        const parsed = val
          ? new Date(/(?:[zZ]$|[+-]\d{2}:?\d{2}$)/.test(val) ? val : `${val}Z`)
          : null
        return (
          <time className="text-xs text-slate-700 tabular-nums" dateTime={val ?? ''}>
            {parsed ? parsed.toLocaleString([], { timeZone: 'Asia/Jakarta' }) : '—'}
          </time>
        )
      },
      sortValue: (row) => row.execution.completedAt ?? '',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => navigate(`/simulation/${row.execution.participantId}`)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-none transition hover:bg-slate-50"
          >
            <ListTree size={12} className="mr-1 inline" />
            Detail
          </button>
          <button
            onClick={() => navigate(`/history/${row.execution.executionId}?tab=flow`)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-none transition hover:bg-slate-50"
          >
            <Route size={12} className="mr-1 inline" />
            Flow
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            aria-label={`Delete execution ${row.execution.executionId}`}
            title="Delete execution log"
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-none transition hover:border-red-200 hover:text-red-600"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <PageFrame mode="operations" className="history-page">
      <PageHeader
        eyebrow="Observability"
        title="Simulation execution history"
        description="Every simulation execution across simulation sessions."
      />

      <SummaryStrip items={summaryItems} />

      <SurfaceSection className="border-b-0 pb-0">
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
      </SurfaceSection>

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
              onClick={() =>
                deleteTarget && removeExecution.mutate(deleteTarget.execution.executionId)
              }
              className="border-0 bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />{' '}
              {removeExecution.isPending ? 'Deleting…' : 'Delete log'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageFrame>
  )
}
