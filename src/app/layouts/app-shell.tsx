import { useQuery } from '@tanstack/react-query'
import { Activity, Clock3, Database, History, Play, Settings, Users, Workflow } from 'lucide-react'
import { type PropsWithChildren, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getWorkflows } from '../../shared/api/workflows'
import { AppSidebar } from './app-sidebar'

const navigation = [
  { label: 'Studio', path: '/studio', icon: Workflow },
  { label: 'Runner', path: '/simulation', icon: Play },
  { label: 'Workflow History', path: '/workflow-history', icon: History },
  { label: 'Participant History', path: '/history', icon: Users },
  { label: 'Master Data', path: '/master-data', icon: Database },
  { label: 'Timers', path: '/timers', icon: Clock3 },
  { label: 'Settings', path: '/settings', icon: Settings },
]

const pageNames: Record<string, string> = Object.fromEntries(navigation.map(({ path, label }) => [path, label]))

function Breadcrumb() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const basePath = `/${segments[0] ?? 'studio'}`
  const title = pageNames[basePath] ?? 'Workspace'
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <span>SimFlow</span>
      <span>/</span>
      <strong>{title}</strong>
      {segments.length > 1 && <><span>/</span><strong>{segments.at(-1)}</strong></>}
    </nav>
  )
}

export function AppShell({ children }: PropsWithChildren) {
  const apiStatus = useQuery({ queryKey: ['workflows', 'api-status'], queryFn: getWorkflows, retry: 0, refetchInterval: 30_000 })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const apiLabel = apiStatus.isPending ? 'Checking API' : apiStatus.isError ? 'API offline' : 'API online'
  const apiClassName = apiStatus.isPending ? 'checking' : apiStatus.isError ? 'offline' : 'online'

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <AppSidebar items={navigation} collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed((c) => !c)} />

      {/* ─── Main content ────────────────────────────────────── */}
      <section className="app-main">
        <header className="app-header">
          <Breadcrumb />
          <div className="header-actions">
            <span className={`api-status ${apiClassName}`}><Activity size={14} />{apiLabel}</span>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </section>
    </div>
  )
}
