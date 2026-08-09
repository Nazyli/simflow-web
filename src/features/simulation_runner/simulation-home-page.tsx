import { ChevronRight, MessageCircle, Play, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../../shared/components/status-badge'
import { channelNavigation, channelPath } from './simulation-channels'
import { useSimulationRun } from './simulation-run-context'
import { useParticipantRuns } from './use-participant-runs'

const CHANNEL_KEYS = ['chat', 'email', 'call', 'document'] as const

export function SimulationHomePage() {
  const { participantId, unreadCounts } = useSimulationRun()
  const { runs, activeExecution, activeWorkflow } = useParticipantRuns(participantId)
  const totalUnread = CHANNEL_KEYS.reduce((sum, channel) => sum + (unreadCounts[channel] ?? 0), 0)

  if (!runs.length) {
    return (
      <div className="flex h-[540px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
        <div>
          <MessageCircle className="mx-auto mb-3 text-violet-500" size={28} />
          <h2 className="text-sm font-semibold text-slate-900">No simulations for this participant</h2>
          <p className="mt-1 text-xs text-slate-500">Start or resume a simulation to open the participant channel workspace.</p>
          <Link to="/simulation" className="!m-0 !mt-4 !inline-flex items-center justify-center gap-1.5 rounded-lg !border-0 !bg-[#5b46c5] !px-3.5 !py-2 text-sm font-semibold !text-white shadow-sm transition hover:!bg-[#4b38ac]"><Play size={15} /> Start a simulation</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-sm"><Workflow size={18} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Active simulation</p>
            <h2 className="truncate text-base font-bold text-slate-900">{activeWorkflow?.workflow_name ?? (activeExecution ? 'Workflow' : 'No active run')}</h2>
            <p className="truncate text-xs text-slate-500">{activeExecution ? `Version ${activeWorkflow?.version_number ?? '—'} · Session ${activeExecution.session_id}` : `${runs.length} workflow run${runs.length === 1 ? '' : 's'} for this participant`}</p>
          </div>
          <div className="flex items-center gap-2">
            {activeExecution ? <StatusBadge status={activeExecution.status} /> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Idle</span>}
            {totalUnread > 0 && <span className="grid min-w-[22px] place-items-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold leading-5 text-white">{totalUnread} unread</span>}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {channelNavigation.map(({ channel, label, description, icon: Icon }) => {
          const unread = unreadCounts[channel] ?? 0
          return (
            <Link key={channel} to={channelPath(participantId, channel)} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-violet-50 text-[#5b46c5] transition group-hover:bg-violet-100"><Icon size={18} /></span>
                {unread > 0 && <span aria-label={`${unread} unread item${unread === 1 ? '' : 's'}`} className="grid min-w-[20px] place-items-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold leading-5 text-white">{unread}</span>}
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">{label}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#5b46c5]">Open <ChevronRight size={14} /></span>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
