import { Layers } from 'lucide-react'
import { StatusBadge } from '../../../shared/components/status-badge'
import type { EmailSimulation } from './types'

interface SimulationSidebarProps {
  simulations: EmailSimulation[]
  selectedSimulation: string | null
  onSelect: (simulationId: string) => void
}

export function SimulationSidebar({
  simulations,
  selectedSimulation,
  onSelect,
}: SimulationSidebarProps) {
  return (
    <aside className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white p-2 lg:w-[220px] lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-2">
      <p className="hidden px-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase lg:block">
        Simulations
      </p>
      {simulations.map((simulation) => {
        const active = simulation.simulationId === selectedSimulation
        return (
          <button
            key={simulation.simulationId}
            type="button"
            onClick={() => onSelect(simulation.simulationId)}
            className={`flex min-w-[200px] rounded-lg px-3 py-2.5 text-left lg:min-w-0 ${
              active
                ? '!border-0 !bg-violet-50 !text-[#9929EA]'
                : '!border-0 !bg-transparent !text-slate-700 hover:!bg-slate-50'
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {simulation.groupSimulationName}
                </span>
                <StatusBadge status={simulation.status} />
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-slate-500">
                  {simulation.simulationName ?? 'Unknown version'}
                </span>
                {simulation.unreadCount > 0 && (
                  <span
                    aria-label={`${simulation.unreadCount} unread email${simulation.unreadCount === 1 ? '' : 's'}`}
                    className="grid size-5 shrink-0 place-items-center rounded-full bg-violet-600 text-[10px] font-bold text-white"
                  >
                    {simulation.unreadCount}
                  </span>
                )}
              </span>
            </span>
          </button>
        )
      })}
      {simulations.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
          <Layers size={18} className="text-slate-300" />
          <p className="text-xs text-slate-400">No simulations in this session.</p>
        </div>
      )}
    </aside>
  )
}
