import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { DataTable, type DataTableColumn } from '../../shared/components/data-table'
import { formatCurrencyAmounts, formatTokenCount } from './usage-logic'
import type { DimensionUsage, ParticipantUsage, UsageEvent } from './usage-types'

function costCell(values: { currency: string; amount: number }[]): string {
  return formatCurrencyAmounts(values).join(' / ') || '—'
}

function formatTimestamp(value: string): string {
  const date = new Date(/(?:z$|[+-]\d{2}:?\d{2}$)/i.test(value) ? value : `${value}Z`)
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function numberCell(value: number, compact = false) {
  return <span className="text-slate-700 tabular-nums">{formatTokenCount(value, compact)}</span>
}

export function ParticipantUsageTable({
  rows,
  search,
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  rows: ParticipantUsage[]
  search: string
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}) {
  const columns: DataTableColumn<ParticipantUsage & { id: string }>[] = [
    {
      id: 'participant',
      header: 'Participant',
      cell: (row) => (
        <Link
          to={`/ai-token-usage/${encodeURIComponent(row.participantId)}${search}`}
          className="block max-w-48 truncate font-mono text-xs font-medium text-violet-700 underline decoration-violet-200 underline-offset-2 hover:text-violet-900"
          title={row.participantId}
        >
          {row.participantId}
        </Link>
      ),
      sortValue: (row) => row.participantId,
      filterValue: (row) => row.participantId,
    },
    {
      id: 'requests',
      header: 'Requests',
      cell: (row) => numberCell(row.requests),
      sortValue: (row) => row.requests,
    },
    {
      id: 'input',
      header: 'Input tokens',
      cell: (row) => numberCell(row.inputTokens, true),
      sortValue: (row) => row.inputTokens,
    },
    {
      id: 'output',
      header: 'Output tokens',
      cell: (row) => numberCell(row.outputTokens, true),
      sortValue: (row) => row.outputTokens,
    },
    {
      id: 'total',
      header: 'Total tokens',
      cell: (row) => (
        <strong className="font-semibold text-slate-900 tabular-nums">
          {formatTokenCount(row.totalTokens, true)}
        </strong>
      ),
      sortValue: (row) => row.totalTokens,
    },
    {
      id: 'average',
      header: 'Avg tokens / request',
      cell: (row) => numberCell(row.averageTokensPerRequest, true),
      sortValue: (row) => row.averageTokensPerRequest,
    },
  ]

  return (
    <div className="min-w-0 overflow-x-auto">
      <DataTable
        rows={rows.map((row) => ({ ...row, id: row.participantId }))}
        columns={columns}
        selectable={false}
        showColumnToggle={false}
        pagination={false}
      />
      <ServerPagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  )
}

export function ModelUsageTable({ rows }: { rows: DimensionUsage[] }) {
  const columns: DataTableColumn<DimensionUsage>[] = [
    {
      id: 'model',
      header: 'Model',
      cell: (row) => (
        <span className="block max-w-52 truncate font-medium text-slate-800" title={row.label}>
          {row.label}
        </span>
      ),
      sortValue: (row) => row.label,
      filterValue: (row) => `${row.label} ${row.provider ?? ''}`,
    },
    {
      id: 'provider',
      header: 'Provider',
      cell: (row) => row.provider ?? '—',
      sortValue: (row) => row.provider ?? '',
    },
    {
      id: 'requests',
      header: 'Requests',
      cell: (row) => numberCell(row.requests),
      sortValue: (row) => row.requests,
    },
    {
      id: 'input',
      header: 'Input tokens',
      cell: (row) => numberCell(row.inputTokens),
      sortValue: (row) => row.inputTokens,
    },
    {
      id: 'output',
      header: 'Output tokens',
      cell: (row) => numberCell(row.outputTokens),
      sortValue: (row) => row.outputTokens,
    },
    {
      id: 'total',
      header: 'Total tokens',
      cell: (row) => (
        <strong className="font-semibold tabular-nums">{formatTokenCount(row.totalTokens)}</strong>
      ),
      sortValue: (row) => row.totalTokens,
    },
    {
      id: 'cost',
      header: 'Cost',
      cell: (row) => (
        <span className="whitespace-nowrap tabular-nums">{costCell(row.costByCurrency)}</span>
      ),
    },
  ]
  return (
    <div className="min-w-0 overflow-x-auto">
      <DataTable
        rows={rows}
        columns={columns}
        selectable={false}
        showColumnToggle={false}
        pagination={false}
      />
    </div>
  )
}

export function UsageEventsTable({ rows }: { rows: UsageEvent[] }) {
  const columns: DataTableColumn<UsageEvent & { id: string }>[] = [
    {
      id: 'capturedAt',
      header: 'Captured at',
      cell: (row) => (
        <time className="whitespace-nowrap tabular-nums" dateTime={row.captured_at}>
          {formatTimestamp(row.captured_at)}
        </time>
      ),
      sortValue: (row) => new Date(row.captured_at).getTime(),
    },
    {
      id: 'simulation',
      header: 'Simulation',
      cell: (row) => (
        <span className="block max-w-44 truncate" title={row.simulation_id}>
          {row.simulation_id}
        </span>
      ),
      sortValue: (row) => row.simulation_id,
      filterValue: (row) => row.simulation_id,
    },
    {
      id: 'activity',
      header: 'Activity type',
      cell: (row) => row.activity_type,
      sortValue: (row) => row.activity_type,
    },
    {
      id: 'node',
      header: 'Node type',
      cell: (row) => row.node_type ?? '—',
      sortValue: (row) => row.node_type ?? '',
    },
    {
      id: 'service',
      header: 'Service',
      cell: (row) => row.service_type,
      sortValue: (row) => row.service_type,
    },
    {
      id: 'provider',
      header: 'Provider',
      cell: (row) => row.provider ?? '—',
      sortValue: (row) => row.provider ?? '',
    },
    {
      id: 'model',
      header: 'Model',
      cell: (row) => (
        <span className="block max-w-40 truncate" title={row.model ?? undefined}>
          {row.model ?? '—'}
        </span>
      ),
      sortValue: (row) => row.model ?? '',
    },
    {
      id: 'input',
      header: 'Input tokens',
      cell: (row) => numberCell(row.input_tokens),
      sortValue: (row) => row.input_tokens,
    },
    {
      id: 'output',
      header: 'Output tokens',
      cell: (row) => numberCell(row.output_tokens),
      sortValue: (row) => row.output_tokens,
    },
    {
      id: 'total',
      header: 'Total tokens',
      cell: (row) => (
        <strong className="font-semibold tabular-nums">{formatTokenCount(row.total_tokens)}</strong>
      ),
      sortValue: (row) => row.total_tokens,
    },
    {
      id: 'cost',
      header: 'Cost',
      cell: (row) => (
        <span className="whitespace-nowrap tabular-nums">
          {costCell([{ currency: row.currency, amount: row.total_cost }])}
        </span>
      ),
    },
  ]
  return (
    <div className="min-w-0 overflow-x-auto">
      <DataTable
        rows={rows.map((row) => ({ ...row, id: row.usage_id }))}
        columns={columns}
        selectable={false}
        showColumnToggle={false}
        pagination={false}
      />
    </div>
  )
}

export function ServerPagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}) {
  const pageCount = Math.max(1, totalPages)
  return (
    <footer className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-x border-b border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-slate-500">
      <span>{totalItems.toLocaleString('en-US')} records</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span>
          Page {page} / {pageCount}
        </span>
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </footer>
  )
}
