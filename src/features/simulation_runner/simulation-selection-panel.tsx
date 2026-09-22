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
    <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
            className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800"
          >
            {selectedIds.length} selected
          </span>
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="rounded px-1.5 py-1 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
              onClick={() => onSelectionChange([])}
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      <div className="relative mt-4">
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
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-sm transition outline-none placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20"
        />
      </div>

      <div className="mt-3 max-h-[min(48vh,26rem)] min-h-24 space-y-5 overflow-y-auto rounded-lg border border-slate-200/80 bg-white p-3 sm:p-4">
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
            <section key={groupName} aria-label={groupName} className="space-y-2">
              <div className="flex items-center justify-between gap-3 px-0.5">
                <h2
                  title={groupName}
                  className="min-w-0 truncate text-xs font-semibold text-slate-600"
                >
                  {groupName}
                </h2>
                <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">
                  {groupSimulations.length}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {groupSimulations.map((simulation) => {
                  const selected = selectedIds.includes(simulation.simulationId)
                  return (
                    <label
                      key={simulation.simulationId}
                      className={cn(
                        'flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-violet-500/40',
                        selected
                          ? 'border-violet-300 bg-violet-50/80'
                          : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40',
                      )}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleSimulation(simulation.simulationId)}
                      />
                      <span className="min-w-0 text-sm leading-5 font-medium text-slate-800">
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
        <p role="status" className="mt-2 text-right text-[11px] text-slate-500">
          Showing {resultCount} of {simulations.length} simulations
        </p>
      )}
    </section>
  )
}
