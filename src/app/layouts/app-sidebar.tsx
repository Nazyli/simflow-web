import { Bot } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

export interface SidebarNavItem {
  label: string
  path: string
  icon: LucideIcon
}

interface AppSidebarProps {
  items: SidebarNavItem[]
}

export function AppSidebar({ items }: AppSidebarProps) {
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="gap-2 px-2 py-1.5 text-[0.92rem] font-bold tracking-tight text-indigo-950 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]">
                <Bot size={16} />
              </span>
              <span className="group-data-[collapsible=icon]:hidden">Scenario Builder</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map(({ label, path, icon: Icon }) => {
              const isActive =
                location.pathname === path || location.pathname.startsWith(`${path}/`)
              return (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
                    <NavLink to={path}>
                      <Icon />
                      <span>{label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
