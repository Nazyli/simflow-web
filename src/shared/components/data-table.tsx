import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type DataTableColumn<T> = {
  id: string
  header: string
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  filterValue?: (row: T) => string
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  pageSize = 10,
  onSelectionChange,
  selectable = true,
}: {
  rows: T[]
  columns: DataTableColumn<T>[]
  pageSize?: number
  onSelectionChange?: (rows: T[]) => void
  selectable?: boolean
}) {
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<{ id: string; desc: boolean } | null>(null)
  const [visible, setVisible] = useState(() => new Set(columns.map((column) => column.id)))
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const shownColumns = columns.filter((column) => visible.has(column.id))
  const filtered = useMemo(
    () =>
      rows
        .filter((row) =>
          columns.some((column) =>
            (column.filterValue?.(row) ?? String(column.sortValue?.(row) ?? ''))
              .toLowerCase()
              .includes(filter.toLowerCase()),
          ),
        )
        .sort((left, right) => {
          if (!sort) return 0
          const column = columns.find((item) => item.id === sort.id)
          const compared = String(column?.sortValue?.(left) ?? '').localeCompare(
            String(column?.sortValue?.(right) ?? ''),
            undefined,
            { numeric: true },
          )
          return sort.desc ? -compared : compared
        }),
    [rows, columns, filter, sort],
  )
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const slice = filtered.slice(
    Math.min(page, pages - 1) * pageSize,
    Math.min(page, pages - 1) * pageSize + pageSize,
  )
  function select(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
    onSelectionChange?.(rows.filter((row) => next.has(row.id)))
  }
  return (
    <section className="overflow-x-auto">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white px-3.5 py-3">
        <Input
          aria-label="Filter rows"
          placeholder="Filter"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value)
            setPage(0)
          }}
          className="w-[180px]"
        />
        <details className="group relative ml-auto">
          <summary className="cursor-pointer text-[0.72rem] font-semibold text-slate-500 group-open:text-violet-600">
            Columns
          </summary>
          <div className="absolute top-full right-0 z-20 mt-1.5 grid min-w-[150px] gap-0.5 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
            {columns.map((column) => (
              <label
                key={column.id}
                className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[0.72rem] text-slate-600 hover:bg-slate-50"
              >
                <Checkbox
                  checked={visible.has(column.id)}
                  onCheckedChange={() =>
                    setVisible((current) => {
                      const next = new Set(current)
                      next.has(column.id) ? next.delete(column.id) : next.add(column.id)
                      return next
                    })
                  }
                />{' '}
                {column.header}
              </label>
            ))}
          </div>
        </details>
      </div>
      <Table>
        <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-1 [&_th]:bg-slate-50 [&_th]:text-[0.66rem] [&_th]:font-bold [&_th]:tracking-[0.06em] [&_th]:uppercase">
          <TableRow>
            {selectable && (
              <TableHead className="w-9">
                <Checkbox
                  aria-label="Select page"
                  checked={slice.length > 0 && slice.every((row) => selected.has(row.id))}
                  onCheckedChange={() => {
                    const next = new Set(selected)
                    const selectPage = !slice.every((row) => next.has(row.id))
                    slice.forEach((row) => (selectPage ? next.add(row.id) : next.delete(row.id)))
                    setSelected(next)
                    onSelectionChange?.(rows.filter((row) => next.has(row.id)))
                  }}
                />
              </TableHead>
            )}
            {shownColumns.map((column) => (
              <TableHead key={column.id}>
                <button
                  type="button"
                  onClick={() =>
                    setSort((current) =>
                      current?.id === column.id
                        ? { id: column.id, desc: !current.desc }
                        : { id: column.id, desc: false },
                    )
                  }
                  className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[0.66rem] font-bold tracking-[0.06em] text-slate-500 uppercase transition hover:text-violet-600"
                >
                  {column.header}
                  {sort?.id === column.id ? (sort.desc ? ' ↓' : ' ↑') : ''}
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {slice.map((row) => (
            <TableRow key={row.id}>
              {selectable && (
                <TableCell>
                  <Checkbox
                    aria-label={`Select ${row.id}`}
                    checked={selected.has(row.id)}
                    onCheckedChange={() => select(row.id)}
                  />
                </TableCell>
              )}
              {shownColumns.map((column) => (
                <TableCell key={column.id} className="text-[0.78rem] text-slate-700">
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {slice.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={shownColumns.length + (selectable ? 1 : 0)}
                className="py-6 text-center text-[0.78rem] text-slate-400"
              >
                No matching records.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-3.5 py-2.5 text-[0.72rem] text-slate-500">
        <span>
          {filtered.length} records{selectable ? ` · ${selected.size} selected` : ''}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span>
            Page {Math.min(page + 1, pages)} / {pages}
          </span>
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={page >= pages - 1}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </footer>
    </section>
  )
}
