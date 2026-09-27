import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Checkbox } from '../../components/ui/checkbox'
import type { PublishedSimulation } from '../../shared/api/simulations'
import { cn } from '../../lib/utils'

interface SimulationSelectionPanelProps {
  simulations: PublishedSimulation[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  isLoading?: boolean
  hasError?: boolean
  className?: string
}

export function SimulationSelectionPanel({
  simulations,
  selectedIds,
  onSelectionChange,
  isLoading = false,
  hasError = false,
  className,
}: SimulationSelectionPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const groupedSimulations = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase()
    const groups = new Map<string, PublishedSimulation[]>()

    simulations.forEach((simulation) => {
      const groupName = simulation.groupSimulationName.trim() || 'Other simulations'
      const matchesQuery =
        !query ||
        simulation.simulationName.toLocaleLowerCase().includes(query) ||
        groupName.toLocaleLowerCase().includes(query)

      if (!matchesQuery) return

      const group = groups.get(groupName) ?? []
      group.push(simulation)
      groups.set(groupName, group)
    })

    return [...groups.entries()]
  }, [searchQuery, simulations])

  function toggleSimulation(simulationId: string) {
    onSelectionChange(
      selectedIds.includes(simulationId)
        ? selectedIds.filter((id) => id !== simulationId)
        : [...selectedIds, simulationId],
    )
  }

  const resultCount = groupedSimulations.reduce((total, [, group]) => total + group.length, 0)

  return (
    <section className={cn('min-w-0 rounded-md border border-slate-200 bg-white p-3', className)}>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <label className="text-xs font-semibold text-slate-800" htmlFor="runner-simulation">
            Simulations
          </label>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span
            aria-live="polite"
            aria-atomic="true"
            className="rounded bg-[#F5E7FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#5B148F]"
          >
            {selectedIds.length} selected
          </span>
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="rounded px-1 py-0.5 text-[10px] font-semibold text-[#9929EA] transition-colors hover:bg-[#F5E7FF] focus-visible:ring-2 focus-visible:ring-[#9929EA]/40 focus-visible:outline-none"
              onClick={() => onSelectionChange([])}
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      <div className="relative mt-2">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400"
        />
        <input
          id="runner-simulation"
          type="search"
          placeholder="Search by simulation or group name"
          value={searchQuery}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault()
          }}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pr-2 pl-8 text-[11px] transition outline-none placeholder:text-slate-400 focus-visible:border-[#9929EA] focus-visible:ring-3 focus-visible:ring-[#9929EA]/20"
        />
      </div>

      <div className="mt-1.5 max-h-[min(48vh,26rem)] min-w-0 space-y-2 overflow-y-auto rounded-md border border-slate-200/80 bg-white p-1.5">
        {isLoading ? (
          <p className="py-5 text-center text-xs text-slate-500">Loading simulations…</p>
        ) : hasError ? (
          <p className="py-5 text-center text-[11px] text-rose-700">
            Unable to load published simulations. Refresh the page to try again.
          </p>
        ) : simulations.length === 0 ? (
          <p className="py-5 text-center text-xs text-slate-500">
            No published simulations are available.
          </p>
        ) : groupedSimulations.length === 0 ? (
          <p className="py-5 text-center text-xs text-slate-500">
            No simulations match “{searchQuery.trim()}”. Try another name or group.
          </p>
        ) : (
          groupedSimulations.map(([groupName, groupSimulations]) => (
            <section key={groupName} aria-label={groupName} className="space-y-1">
              <div className="flex items-center justify-between gap-2 px-1">
                <h2
                  title={groupName}
                  className="min-w-0 truncate text-[10px] font-semibold text-slate-600"
                >
                  {groupName}
                </h2>
                <span className="shrink-0 text-[10px] text-slate-400 tabular-nums">
                  {groupSimulations.length}
                </span>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
                {groupSimulations.map((simulation) => {
                  const selected = selectedIds.includes(simulation.simulationId)
                  return (
                    <label
                      key={simulation.simulationId}
                      className={cn(
                        'flex min-h-9 min-w-0 cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] transition-colors focus-within:ring-2 focus-within:ring-[#9929EA]/30',
                        selected
                          ? 'border-[#DBABFF] bg-[#F5E7FF]/70'
                          : 'border-slate-200 bg-white hover:border-[#DBABFF] hover:bg-[#F5E7FF]/40',
                      )}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleSimulation(simulation.simulationId)}
                      />
                      <span className="min-w-0 truncate text-[11px] leading-4 font-medium text-slate-800">
                        {simulation.simulationName}
                      </span>
                    </label>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>
      {!isLoading && !hasError && simulations.length > 0 && (
        <p role="status" className="mt-1 text-right text-[10px] text-slate-500">
          Showing {resultCount} of {simulations.length} simulations
        </p>
      )}
    </section>
  )
}
