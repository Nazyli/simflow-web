import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { channelNavigation, channelPath } from './simulation-channels'
import { useSimulationRun } from './simulation-run-context'

export function SimulationHomePage() {
  const { participantId, unreadCounts } = useSimulationRun()

  return (
    <div className="flex h-full flex-col gap-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {channelNavigation.map(({ channel, label, description, icon: Icon }) => {
          const unread = unreadCounts[channel] ?? 0
          return (
            <Link
              key={channel}
              to={channelPath(participantId, channel)}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-violet-50 text-[#5b46c5] transition group-hover:bg-violet-100">
                  <Icon size={18} />
                </span>
                {unread > 0 && (
                  <span
                    aria-label={`${unread} unread item${unread === 1 ? '' : 's'}`}
                    className="grid min-w-[20px] place-items-center rounded-full bg-violet-600 px-1.5 text-[10px] leading-5 font-bold text-white"
                  >
                    {unread}
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">{label}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#5b46c5]">
                Open <ChevronRight size={14} />
              </span>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
