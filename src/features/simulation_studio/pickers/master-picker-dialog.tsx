import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import { getStudioMasterData } from '../../../shared/api/master-data'

function displayValue(record: Record<string, unknown>, field: string): string {
  const value = record[field]
  return value === null || value === undefined ? '—' : String(value)
}

function columnLabel(field: string): string {
  return field
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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
    queryFn: () => getStudioMasterData(endpoint ?? `/studio/master-data/${resource}`),
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
      <DialogContent className="flex max-h-[min(640px,calc(100vh-48px))] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <div className="grid gap-3 px-6 pt-6 pb-4">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              className="pl-8"
              placeholder="Search records..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="min-h-40 flex-1 overflow-auto border-y">
          <Table>
            <TableHeader className="bg-popover sticky top-0 z-10">
              <TableRow>
                {displayFields.map((field) => (
                  <TableHead key={field}>{columnLabel(field)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.isPending ? (
                <TableRow>
                  <TableCell
                    colSpan={displayFields.length}
                    className="text-muted-foreground py-6 text-center text-xs"
                  >
                    Loading records...
                  </TableCell>
                </TableRow>
              ) : records.isError ? (
                <TableRow>
                  <TableCell
                    colSpan={displayFields.length}
                    className="text-destructive py-6 text-center text-xs"
                  >
                    Unable to load records.
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={displayFields.length}
                    className="text-muted-foreground py-6 text-center text-xs"
                  >
                    No matching records.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((record) => (
                  <TableRow
                    key={JSON.stringify(record)}
                    className="cursor-pointer"
                    onClick={() => {
                      onSelect(record)
                      onOpenChange(false)
                    }}
                  >
                    {displayFields.map((field, index) => (
                      <TableCell
                        key={field}
                        className={
                          index === 0 ? 'max-w-xs font-medium' : 'text-muted-foreground max-w-xs'
                        }
                      >
                        <span className="line-clamp-2">{displayValue(record, field)}</span>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-6 py-3">
          <p className="text-muted-foreground text-xs">
            {records.isSuccess ? `${rows.length} record${rows.length === 1 ? '' : 's'}` : ' '}
          </p>
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
