import { Bot, Layers, PanelLeftClose } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

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

export function AppSidebar({ items, collapsed, onToggleCollapsed }: AppSidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="brand">
        <span className="brand-mark"><Bot size={16} /></span>
        <span>SimFlow</span>
        <button
          type="button"
          className="sidebar-collapse !mt-0 !p-1.5 !rounded-lg !border-0 !bg-transparent !text-slate-500 !shadow-none transition-colors hover:!text-slate-900 hover:!bg-slate-100"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleCollapsed}
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      <nav className="primary-nav" aria-label="Primary navigation">
        {!collapsed && (
          <h2 className="sidebar-nav-label flex items-center gap-1.5 px-2 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Layers size={14} className="text-purple-600" /> Menu
          </h2>
        )}
        {items.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
