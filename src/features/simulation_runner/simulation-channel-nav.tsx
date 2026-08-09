import { NavLink } from 'react-router-dom'
import { channelNavigation, channelPath } from './simulation-channels'
import { useSimulationRun } from './simulation-run-context'

export function SimulationChannelNav() {
  const { participantId, unreadCounts } = useSimulationRun()
  return (
    <nav
      aria-label="Simulation channels"
      className="flex shrink-0 items-start gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:w-14 lg:flex-col lg:overflow-visible"
    >
      {channelNavigation.map(({ channel, label, icon: Icon }) => {
        const unread = unreadCounts[channel] ?? 0
        return (
          <NavLink
            key={channel}
            to={channelPath(participantId, channel)}
            title={label}
            aria-label={label}
            className={({ isActive }) =>
              `relative !m-0 grid size-10 shrink-0 place-items-center rounded-lg !border-0 transition lg:w-full ${isActive ? '!bg-violet-100 !text-violet-800 shadow-sm' : '!bg-transparent !text-slate-600 hover:!bg-slate-100 hover:!text-slate-900'}`
            }
          >
            <Icon size={18} />
            {unread > 0 && (
              <span
                aria-label={`${unread} unread item${unread === 1 ? '' : 's'}`}
                className="absolute -top-1 -right-1 grid min-w-[18px] place-items-center rounded-full bg-violet-600 px-1 text-[10px] leading-4 font-bold text-white"
              >
                {unread}
              </span>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
