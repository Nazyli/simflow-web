import { Clock3, Database, Play, Users, Workflow } from 'lucide-react'
import { type PropsWithChildren } from 'react'
import { useLocation } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'

const navigation = [
  { label: 'Studio', path: '/studio', icon: Workflow },
  { label: 'Runner', path: '/simulation', icon: Play },
  { label: 'Participant History', path: '/history', icon: Users },
  { label: 'Master Data', path: '/master-data', icon: Database },
  { label: 'Timers', path: '/timers', icon: Clock3 },
]

const pageNames: Record<string, string> = Object.fromEntries(navigation.map(({ path, label }) => [path, label]))

function Breadcrumb() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const basePath = `/${segments[0] ?? 'studio'}`
  const title = pageNames[basePath] ?? 'Workspace'
  return (
    <nav className="flex items-center gap-2 overflow-hidden text-[0.76rem] text-slate-400 whitespace-nowrap max-[620px]:max-w-[180px] max-[620px]:mr-auto" aria-label="Breadcrumb">
      <span>Scenario Builder</span>
      <span>/</span>
      <strong className="font-semibold text-slate-600">{title}</strong>
      {segments.length > 1 && <><span>/</span><strong className="font-semibold text-slate-600">{segments.at(-1)}</strong></>}
    </nav>
  )
}

export function AppShell({ children }: PropsWithChildren) {
  return (
    <SidebarProvider className="bg-slate-100">
      <AppSidebar items={navigation} />

      <SidebarInset className="bg-slate-100">
        <header className="sticky top-0 z-10 flex min-h-[58px] items-center gap-2 border-b border-slate-200 bg-[rgb(251,252,254)]/95 px-[26px] backdrop-blur-md max-[900px]:px-[18px] max-[620px]:min-h-[54px] max-[620px]:px-3">
          <SidebarTrigger className="shrink-0 text-slate-500" />
          <Breadcrumb />
        </header>
        <div className="app-content mx-0 mt-0 max-w-none p-7 max-[900px]:px-[18px] max-[900px]:py-[22px] max-[620px]:p-3">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
