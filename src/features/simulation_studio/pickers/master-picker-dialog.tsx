import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Input } from '../../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../../components/ui/dialog'
import { getMasterData, getStudioMasterData } from '../../../shared/api/master-data'

function displayValue(record: Record<string, unknown>, field: string): string {
  const value = record[field]
  return value === null || value === undefined ? '—' : String(value)
}

export function MasterPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  resource,
  endpoint,
  displayFields,
  filter,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  resource: string
  endpoint?: string
  displayFields: string[]
  filter?: { field: string; value: string }
  onSelect: (record: Record<string, unknown>) => void
}) {
  const [query, setQuery] = useState('')
  const records = useQuery({
    queryKey: ['master', resource, endpoint ?? ''],
    queryFn: () => (endpoint ? getStudioMasterData(endpoint) : getMasterData(resource)),
  })
  const rows = useMemo(() => {
    const source = records.data ?? []
    const q = query.trim().toLowerCase()
    return source.filter((record) => {
      if (filter?.value) {
        const recordValue = record[filter.field]
        if (String(recordValue ?? '') !== filter.value) return false
      }
      if (!q) return true
      return displayFields.some((field) =>
        String(record[field] ?? '')
          .toLowerCase()
          .includes(q),
      )
    })
  }, [records.data, query, filter, displayFields])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(640px,calc(100vh-48px))] overflow-auto p-6 sm:max-w-5xl">
        <DialogTitle className="text-base font-bold text-slate-900">{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-8"
            placeholder="Search records..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          {records.isPending ? (
            <p className="py-6 text-center text-xs text-slate-500">Loading records...</p>
          ) : records.isError ? (
            <p className="py-6 text-center text-xs text-red-600">Unable to load records.</p>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No matching records.</p>
          ) : (
            rows.map((record) => (
              <button
                key={JSON.stringify(record)}
                type="button"
                className="flex flex-col gap-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-left transition hover:border-purple-200 hover:bg-purple-50"
                onClick={() => {
                  onSelect(record)
                  onOpenChange(false)
                }}
              >
                <span className="truncate text-sm font-semibold text-slate-800">
                  {displayValue(record, displayFields[0])}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  {displayFields.slice(1).map((field, index) => (
                    <span key={field} className="flex min-w-0 items-center gap-1.5">
                      {index > 0 && <span className="text-slate-300">·</span>}
                      <span className="truncate">{displayValue(record, field)}</span>
                    </span>
                  ))}
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
