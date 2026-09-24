import { type PropsWithChildren } from 'react'
import { useLocation } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { navigation, pageNames } from './navigation'

function Breadcrumb() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const basePath = `/${segments[0] ?? 'studio'}`
  const title = pageNames[basePath] ?? 'Workspace'
  return (
    <nav
      className="flex items-center gap-2 overflow-hidden text-[0.76rem] whitespace-nowrap text-slate-400 max-[620px]:mr-auto max-[620px]:max-w-[180px]"
      aria-label="Breadcrumb"
    >
      <span>Simulation Builder</span>
      <span>/</span>
      <strong className="font-semibold text-slate-600">{title}</strong>
      {segments.length > 1 && (
        <>
          <span>/</span>
          <strong className="font-semibold text-slate-600">
            {pageNames[location.pathname] ?? segments.at(-1)}
          </strong>
        </>
      )}
    </nav>
  )
}

export function AppShell({ children }: PropsWithChildren) {
  return (
    <SidebarProvider defaultOpen={true} className="overflow-x-hidden bg-slate-100">
      <AppSidebar items={navigation} />

      <SidebarInset className="min-w-0 overflow-x-hidden bg-slate-100">
        <header className="sticky top-0 z-10 flex min-h-[48px] w-full min-w-0 items-center gap-2 overflow-hidden border-b border-slate-200 bg-[rgb(251,252,254)]/95 px-[26px] backdrop-blur-md max-[900px]:px-[18px] max-[620px]:min-h-[48px] max-[620px]:px-3">
          <SidebarTrigger className="shrink-0 text-slate-500" />
          <Breadcrumb />
        </header>
        <div className="app-content min-w-0 max-w-none">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
