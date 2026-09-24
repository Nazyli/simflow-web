import { ChevronDown, ChevronUp, Clock3, Play, RefreshCw, UserRound } from 'lucide-react'
import { useState } from 'react'
import { StatusBadge } from '../../shared/components/status-badge'
import { useParticipantRuns } from './use-participant-runs'

const STORAGE_KEY = 'simflow-runner-info-panel-visible'

function readPanelVisible(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function persistPanelVisible(visible: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, visible ? '1' : '0')
  } catch {
    // Ignore storage failures; the toggle keeps working for the session.
  }
}

export function SimulationInfoPanel({ participantId }: { participantId: string }) {
  const [visible, setVisible] = useState(readPanelVisible)
  const { activeExecution, activeSimulation } = useParticipantRuns(participantId, {
    enabled: visible,
  })
  const elapsed = activeExecution
    ? new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' }).format(new Date())
    : '—'

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => {
          setVisible(true)
          persistPanelVisible(true)
        }}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-violet-200 hover:text-[#9929EA] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
      >
        <ChevronDown size={14} /> Show simulation info
      </button>
    )
  }

  return (
    <div>
      <header className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-violet-50 text-violet-700">
            <Play size={18} />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-bold tracking-[0.12em] text-purple-700 uppercase">
              Participant console
            </span>
            <h1 className="min-w-0 truncate text-base font-bold text-slate-900">
              {activeSimulation?.groupSimulationName ?? 'Participant workspace'}
            </h1>
            <p className="min-w-0 truncate text-xs text-slate-500">
              {activeExecution
                ? `${activeSimulation?.simulationName ?? 'Simulation'} · Session ${activeExecution.sessionId}`
                : 'No active simulation for this participant yet.'}
            </p>
          </div>
        </div>
        <div className="flex max-w-full min-w-0 flex-wrap items-center gap-1.5">
          <div className="flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
            <UserRound size={14} className="shrink-0 text-[#9929EA]" />
            <div className="min-w-0">
              <small className="block text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                Participant
              </small>
              <strong className="block max-w-[160px] truncate text-xs text-slate-800">
                {participantId}
              </strong>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
            <Clock3 size={14} className="shrink-0 text-[#9929EA]" />
            <div>
              <small className="block text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                Elapsed
              </small>
              <strong className="block text-xs text-slate-800">{elapsed}</strong>
            </div>
          </div>
          {activeExecution && (
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <small className="block text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                Execution
              </small>
              <StatusBadge status={activeExecution.status} />
            </div>
          )}
          <button
            type="button"
            aria-label="Hide simulation info"
            onClick={() => {
              setVisible(false)
              persistPanelVisible(false)
            }}
            className="grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-400 transition hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
          >
            <ChevronUp size={15} />
          </button>
        </div>
      </header>

      {activeExecution?.status === 'waiting' && (
        <section className="mt-3 flex min-w-0 items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-600">
            <Clock3 size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <strong className="text-sm text-amber-900">Participant action required</strong>
            <p className="mt-0.5 text-xs text-amber-700">
              Open the simulation that is waiting on the Conversations channel and reply there. The
              selected simulation scopes your reply; actions sent to the wrong simulation are
              rejected.
            </p>
          </div>
          <StatusBadge status="waiting" />
        </section>
      )}

      {(activeExecution?.status === 'completed' || activeExecution?.status === 'failed') && (
        <section className="mt-3 flex min-w-0 flex-wrap items-center gap-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-sky-100 text-sky-600">
            <RefreshCw size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <strong className="text-sm text-sky-900">Previous simulation finished</strong>
            <p className="mt-0.5 text-xs text-sky-700">
              This participant already completed this simulation. Review the result above or start a
              new run.
            </p>
          </div>
          <StatusBadge status={activeExecution.status} />
        </section>
      )}
    </div>
  )
}
