import { Bot, Layers, PanelLeftClose } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface SidebarNavItem {
  label: string
  path: string
  icon: LucideIcon
}

interface AppSidebarProps {
  items: SidebarNavItem[]
  collapsed: boolean
  onToggleCollapsed: () => void
}

const hideWhenCompact = '[data-collapsed_&]:hidden max-[900px]:!hidden'

export function AppSidebar({ items, collapsed, onToggleCollapsed }: AppSidebarProps) {
  return (
    <aside
      data-collapsed={collapsed || undefined}
      className="fixed inset-y-0 left-0 z-30 flex min-h-screen w-[220px] flex-col border-r border-slate-200 bg-white px-2.5 py-4 text-slate-600 shadow-[2px_0_12px_rgba(15,23,42,0.04)] data-collapsed:w-16 data-collapsed:px-[9px] data-collapsed:py-[15px] max-[900px]:!w-16 max-[900px]:!px-[9px] max-[900px]:!py-[15px] max-[620px]:!w-[264px] max-[620px]:!translate-x-[-100%] max-[620px]:!px-3 max-[620px]:!py-[18px] max-[620px]:!transition-transform max-[620px]:!duration-200 max-[620px]:shadow-[12px_0_36px_rgba(15,23,42,0.2)]"
    >
      <div className="flex items-center gap-2 px-2 pt-1 pb-[18px] text-[0.92rem] font-bold tracking-tight text-indigo-950 [data-collapsed_&]:justify-center [data-collapsed_&]:px-0 [data-collapsed_&]:pb-[22px] max-[900px]:!justify-center max-[900px]:!px-0 max-[900px]:!pb-[22px]">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]"><Bot size={16} /></span>
        <span className={hideWhenCompact}>SimFlow</span>
        <button
          type="button"
          className="ml-auto rounded-lg border-0 bg-transparent p-1.5 text-slate-500 shadow-none transition-colors hover:bg-slate-100 hover:text-slate-900 [data-collapsed_&]:absolute [data-collapsed_&]:bottom-4 [data-collapsed_&]:left-1/2 [data-collapsed_&]:m-0 [data-collapsed_&]:-translate-x-1/2 max-[900px]:!hidden"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleCollapsed}
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      <nav className="mt-2 grid gap-0.5" aria-label="Primary navigation">
        {!collapsed && (
          <h2 className={`flex items-center gap-1.5 px-2 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500 ${hideWhenCompact}`}>
            <Layers size={14} className="text-purple-600" /> Menu
          </h2>
        )}
        {items.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => cn('flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.82rem] font-medium text-slate-500 no-underline transition hover:bg-slate-100 hover:text-slate-800 [data-collapsed_&]:justify-center [data-collapsed_&]:px-[11px] max-[900px]:!justify-center max-[900px]:!px-[11px]', isActive && 'bg-violet-100 font-semibold text-violet-800')}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-violet-600' : undefined} />
                <span className={hideWhenCompact}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
