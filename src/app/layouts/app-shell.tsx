import * as Dialog from '@radix-ui/react-dialog'
import { useQuery } from '@tanstack/react-query'
import { Activity, Bot, ChevronDown, Clock3, Database, History, Menu, PanelLeftClose, Play, Search, Settings, Sparkles, Workflow, X } from 'lucide-react'
import { type KeyboardEvent, type PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getWorkflows } from '../../shared/api/workflows'

const navigation = [
  { label: 'Studio', path: '/studio', icon: Workflow, description: 'Build and manage workflows' },
  { label: 'Runner', path: '/simulation', icon: Play, description: 'Run live simulations' },
  { label: 'History', path: '/history', icon: History, description: 'Inspect execution activity' },
  { label: 'Master Data', path: '/master-data', icon: Database, description: 'Manage shared entities' },
  { label: 'Timers', path: '/timers', icon: Clock3, description: 'Schedule workflow runs' },
  { label: 'Settings', path: '/settings', icon: Settings, description: 'Configure your workspace' },
]

const pageNames: Record<string, string> = Object.fromEntries(navigation.map(({ path, label }) => [path, label]))

function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const workflows = useQuery({ queryKey: ['workflows', 'command-palette'], queryFn: getWorkflows, enabled: open })

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const pages = navigation.filter((item) => !normalizedQuery || `${item.label} ${item.description}`.toLowerCase().includes(normalizedQuery))
  const matchingWorkflows = useMemo(
    () => (workflows.data ?? []).filter((workflow) => workflow.workflow_name.toLowerCase().includes(normalizedQuery)).slice(0, 5),
    [normalizedQuery, workflows.data],
  )
  const select = (path: string) => { navigate(path); setOpen(false); setQuery('') }
  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') setOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="command-trigger" type="button" aria-label="Open command palette"><Search size={16} /><span>Search or jump to…</span><kbd>Ctrl K</kbd></button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="command-overlay" />
        <Dialog.Content className="command-dialog" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <div className="command-input"><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onInputKeyDown} placeholder="Search pages and workflows…" /></div>
          <div className="command-results">
            <p>Navigate</p>
            {pages.map(({ label, path, icon: Icon, description }) => <button key={path} type="button" onClick={() => select(path)}><Icon size={17} /><span><strong>{label}</strong><small>{description}</small></span></button>)}
            {matchingWorkflows.length > 0 && <><p>Workflows</p>{matchingWorkflows.map((workflow) => <button key={workflow.workflow_id} type="button" onClick={() => select('/studio')}><Sparkles size={17} /><span><strong>{workflow.workflow_name}</strong><small>Open in Studio</small></span></button>)}</>}
            {workflows.isError && <p className="command-empty">Workflow search is temporarily unavailable.</p>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Breadcrumb() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const basePath = `/${segments[0] ?? 'studio'}`
  const title = pageNames[basePath] ?? 'Workspace'
  return <nav className="breadcrumb" aria-label="Breadcrumb"><span>Workspace</span><span>/</span><strong>{title}</strong>{segments.length > 1 && <><span>/</span><strong>{segments.at(-1)}</strong></>}</nav>
}

export function AppShell({ children }: PropsWithChildren) {
  const apiStatus = useQuery({ queryKey: ['workflows', 'api-status'], queryFn: getWorkflows, retry: 0, refetchInterval: 30_000 })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const apiLabel = apiStatus.isPending ? 'Checking API' : apiStatus.isError ? 'API offline' : 'API online'
  const apiClassName = apiStatus.isPending ? 'checking' : apiStatus.isError ? 'offline' : 'online'
  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="brand"><span className="brand-mark"><Bot size={19} /></span><span>SimFlow</span><button type="button" className="sidebar-collapse" aria-label="Collapse sidebar" onClick={() => setMobileNavOpen(false)}><PanelLeftClose size={17} /></button></div>
        <div className="workspace-summary"><span className="workspace-icon">A</span><div><strong>Acme Simulation</strong><small>Production workspace</small></div><ChevronDown size={15} /></div>
        <nav className="primary-nav" aria-label="Primary navigation">{navigation.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} onClick={() => setMobileNavOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
        <div className="sidebar-bottom"><div className="upgrade-card"><Sparkles size={16} /><strong>Scale your simulations</strong><span>Coordinate complex AI workflows with confidence.</span><button type="button">View usage</button></div><div className="sidebar-profile"><span className="avatar">JD</span><div><strong>Jordan Davis</strong><small>Workspace admin</small></div><ChevronDown size={15} /></div></div>
      </aside>
      <section className="app-main">
        <header className="app-header"><button type="button" className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen((current) => !current)}>{mobileNavOpen ? <X size={18} /> : <Menu size={18} />}</button><Breadcrumb /><div className="header-actions"><span className={`api-status ${apiClassName}`}><Activity size={14} />{apiLabel}</span><CommandPalette /><button type="button" className="header-avatar" aria-label="Open profile">JD</button></div></header>
        <main className="app-content">{children}</main>
      </section>
    </div>
  )
}
