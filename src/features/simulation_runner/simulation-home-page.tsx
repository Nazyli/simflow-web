import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/page-header'
import { channelNavigation, channelPath } from './simulation-channels'
import { useSimulationRun } from './simulation-run-context'

export function SimulationHomePage() {
  const { participantId, unreadCounts } = useSimulationRun()

  return (
    <div className="flex h-full min-w-0 flex-col gap-4">
      <PageHeader
        title="Participant workspace"
        description="Choose a channel to continue the active simulation session. Live activity and unread counts stay scoped to this participant."
        metadata={
          <span>
            {Object.values(unreadCounts).reduce((total, count) => total + count, 0)} unread activity
          </span>
        }
      />
      <section className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {channelNavigation.map(({ channel, label, description, icon: Icon }) => {
          const unread = unreadCounts[channel] ?? 0
          return (
            <Link
              key={channel}
              to={channelPath(participantId, channel)}
              className="group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-3.5 transition hover:border-violet-300 hover:bg-violet-50/30 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-8 place-items-center rounded-md bg-violet-50 text-[#9929EA] transition group-hover:bg-violet-100">
                  <Icon size={18} />
                </span>
                {unread > 0 && (
                  <span
                    aria-label={`${unread} unread item${unread === 1 ? '' : 's'}`}
                    className="grid min-w-[20px] place-items-center rounded-md bg-violet-600 px-1.5 text-[10px] leading-5 font-bold text-white"
                  >
                    {unread}
                  </span>
                )}
              </div>
              <h3 className="mt-3 min-w-0 truncate text-sm font-bold text-slate-900">{label}</h3>
              <p className="mt-0.5 min-w-0 text-xs leading-relaxed text-slate-500">{description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#9929EA]">
                Open <ChevronRight size={14} />
              </span>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
