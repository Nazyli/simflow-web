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
}

export function SimulationSelectionPanel({
  simulations,
  selectedIds,
  onSelectionChange,
  isLoading = false,
  hasError = false,
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
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label className="text-sm font-semibold text-slate-800" htmlFor="runner-simulation">
            Simulations
          </label>
          <p className="mt-0.5 text-xs text-slate-500">
            Search and select one or more simulations to run.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span
            aria-live="polite"
            aria-atomic="true"
            className="rounded-md bg-[#F5E7FF] px-2 py-1 text-[11px] font-semibold text-[#5B148F]"
          >
            {selectedIds.length} selected
          </span>
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="rounded px-1.5 py-1 text-[11px] font-semibold text-[#9929EA] transition-colors hover:bg-[#F5E7FF] focus-visible:ring-2 focus-visible:ring-[#9929EA]/40 focus-visible:outline-none"
              onClick={() => onSelectionChange([])}
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      <div className="relative mt-3">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
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
          className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pr-3 pl-9 text-xs transition outline-none placeholder:text-slate-400 focus-visible:border-[#9929EA] focus-visible:ring-3 focus-visible:ring-[#9929EA]/20"
        />
      </div>

      <div className="mt-2 max-h-[min(48vh,26rem)] space-y-3 overflow-y-auto rounded-md border border-slate-200/80 bg-slate-50/50 p-2">
        {isLoading ? (
          <p className="py-7 text-center text-sm text-slate-500">Loading simulations…</p>
        ) : hasError ? (
          <p className="py-7 text-center text-sm text-rose-700">
            Unable to load published simulations. Refresh the page to try again.
          </p>
        ) : simulations.length === 0 ? (
          <p className="py-7 text-center text-sm text-slate-500">
            No published simulations are available.
          </p>
        ) : groupedSimulations.length === 0 ? (
          <p className="py-7 text-center text-sm text-slate-500">
            No simulations match “{searchQuery.trim()}”. Try another name or group.
          </p>
        ) : (
          groupedSimulations.map(([groupName, groupSimulations]) => (
            <section key={groupName} aria-label={groupName} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 px-1">
                <h2
                  title={groupName}
                  className="min-w-0 truncate text-[11px] font-semibold text-slate-600"
                >
                  {groupName}
                </h2>
                <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">
                  {groupSimulations.length}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {groupSimulations.map((simulation) => {
                  const selected = selectedIds.includes(simulation.simulationId)
                  return (
                    <label
                      key={simulation.simulationId}
                      className={cn(
                        'flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 transition-colors focus-within:ring-2 focus-within:ring-[#9929EA]/30',
                        selected
                          ? 'border-[#DBABFF] bg-[#F5E7FF]/70'
                          : 'border-slate-200 bg-white hover:border-[#DBABFF] hover:bg-[#F5E7FF]/40',
                      )}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleSimulation(simulation.simulationId)}
                      />
                      <span className="min-w-0 truncate text-xs leading-4 font-medium text-slate-800">
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
        <p role="status" className="mt-1.5 text-right text-[10px] text-slate-500">
          Showing {resultCount} of {simulations.length} simulations
        </p>
      )}
    </section>
  )
}
