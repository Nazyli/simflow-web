import { Clock3, Play, RefreshCw, UserRound } from 'lucide-react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { StatusBadge } from '../../shared/components/status-badge'
import { SimulationChannelNav } from './simulation-channel-nav'
import { SimulationRunProvider, useSimulationRun } from './simulation-run-context'

function SimulationRunShell() {
  const { activeExecution, activeWorkflow, participantId } = useSimulationRun()
  const elapsed = activeExecution ? new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' }).format(new Date()) : '—'

  return (
    <main className="simulation-runner-page min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-sm"><Play size={18} /></span>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Participant console</span>
            <h1 className="truncate text-lg font-bold text-slate-900">{activeWorkflow?.workflow_name ?? 'Participant workspace'}</h1>
            <p className="truncate text-xs text-slate-500">{activeExecution ? `Version ${activeWorkflow?.version_number ?? '—'} · Session ${activeExecution.session_id}` : 'No active simulation for this participant yet.'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <UserRound size={14} className="shrink-0 text-[#5b46c5]" />
            <div className="min-w-0">
              <small className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Participant</small>
              <strong className="block max-w-[160px] truncate text-xs text-slate-800">{participantId}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Clock3 size={14} className="shrink-0 text-[#5b46c5]" />
            <div>
              <small className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Elapsed</small>
              <strong className="block text-xs text-slate-800">{elapsed}</strong>
            </div>
          </div>
          {activeExecution && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <small className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Execution</small>
              <StatusBadge status={activeExecution.status} />
            </div>
          )}
        </div>
      </header>

      {activeExecution?.status === 'waiting' && (
        <section className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600"><Clock3 size={18} /></span>
          <div className="min-w-0 flex-1">
            <strong className="text-sm text-amber-900">Participant action required</strong>
            <p className="mt-0.5 text-xs text-amber-700">Open the workflow that is waiting on the Conversations channel and reply there. The selected workflow scopes your reply; actions sent to the wrong workflow are rejected.</p>
          </div>
          <StatusBadge status="waiting" />
        </section>
      )}

      {(activeExecution?.status === 'completed' || activeExecution?.status === 'failed') && (
        <section className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-600"><RefreshCw size={18} /></span>
          <div className="min-w-0 flex-1">
            <strong className="text-sm text-sky-900">Previous simulation finished</strong>
            <p className="mt-0.5 text-xs text-sky-700">This participant already completed this simulation. Review the result above or start a new run.</p>
          </div>
          <StatusBadge status={activeExecution.status} />
        </section>
      )}

      <section className="mt-4 flex min-h-[540px] flex-col gap-4 lg:flex-row">
        <SimulationChannelNav />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </section>
    </main>
  )
}

export function SimulationRunLayout() {
  const { participantId } = useParams()
  if (!participantId?.trim()) return <Navigate to="/simulation" replace />
  return (
    <SimulationRunProvider participantId={participantId.trim()}>
      <SimulationRunShell />
    </SimulationRunProvider>
  )
}
