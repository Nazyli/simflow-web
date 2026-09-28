import { Bot, ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'

export interface SidebarNavChild {
  label: string
  path: string
  icon?: LucideIcon
}

export interface SidebarNavItem {
  label: string
  path: string
  icon: LucideIcon
  children?: SidebarNavChild[]
}

interface AppSidebarProps {
  items: SidebarNavItem[]
}

const primaryPaths = new Set(['/studio', '/simulation', '/history', '/timers'])
const resourcePaths = new Set(['/documentation', '/master-data'])

function isItemActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function AppSidebar({ items }: AppSidebarProps) {
  const location = useLocation()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const primaryItems = items.filter((item) => primaryPaths.has(item.path))
  const resourceItems = items.filter((item) => resourcePaths.has(item.path))
  const settingsItem = items.find((item) => item.path === '/settings')

  const renderItem = ({ label, path, icon: Icon, children }: SidebarNavItem) => {
    const isActive = isItemActive(location.pathname, path)
    const hasChildren = Boolean(children?.length)
    const expanded = expandedGroups[path] ?? isActive
    const itemClassName =
      'h-8 rounded-md px-2 text-xs text-sidebar-foreground/75 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-[#F5E7FF] data-[active=true]:font-semibold data-[active=true]:text-[#5B148F]'

    if (hasChildren) {
      return (
        <SidebarMenuItem key={path}>
          <SidebarMenuButton
            type="button"
            isActive={isActive}
            tooltip={label}
            className={itemClassName}
            onClick={() => setExpandedGroups((current) => ({ ...current, [path]: !expanded }))}
          >
            <Icon size={16} strokeWidth={1.8} />
            <span>{label}</span>
            <ChevronDown
              size={14}
              strokeWidth={1.8}
              className={`ml-auto transition-transform duration-150 group-data-[collapsible=icon]:hidden ${expanded ? 'rotate-180' : ''}`}
            />
          </SidebarMenuButton>
          {expanded && (
            <SidebarMenuSub className="ml-4 border-slate-200/80 pl-3">
              {children?.map(({ label: childLabel, path: childPath, icon: ChildIcon }) => {
                const childActive = isItemActive(location.pathname, childPath)
                return (
                  <SidebarMenuSubItem key={childPath}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={childActive}
                      className="text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 rounded-md text-xs transition-colors duration-150 data-[active=true]:bg-[#F5E7FF] data-[active=true]:font-semibold data-[active=true]:text-[#5B148F]"
                    >
                      <NavLink to={childPath}>
                        {ChildIcon && <ChildIcon size={15} strokeWidth={1.8} />}
                        <span>{childLabel}</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              })}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
      )
    }

    return (
      <SidebarMenuItem key={path}>
        <SidebarMenuButton asChild isActive={isActive} tooltip={label} className={itemClassName}>
          <NavLink to={path}>
            <Icon size={16} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Sidebar collapsible="icon" className="z-20 overflow-x-hidden border-slate-200/80">
      <SidebarHeader className="border-sidebar-border/70 h-10 min-h-10 gap-0 overflow-hidden border-b p-0">
        <SidebarMenu className="h-full gap-0">
          <SidebarMenuItem className="flex h-full items-center">
            <SidebarMenuButton
              size="lg"
              className="h-full gap-2 rounded-md px-2 text-xs font-semibold tracking-[-0.01em] text-slate-800 transition-colors duration-150 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 hover:bg-slate-50"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#9929EA] text-white">
                <Bot size={15} strokeWidth={2.2} />
              </span>
              <span className="group-data-[collapsible=icon]:hidden">Simulation Builder</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 overflow-x-hidden">
        <SidebarGroup className="px-2 py-3">
          <SidebarGroupLabel className="px-2 text-xs font-semibold tracking-[0.08em] text-slate-400 uppercase">
            Build & operate
          </SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">{primaryItems.map(renderItem)}</SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="mx-2" />

        <SidebarGroup className="px-2 py-3">
          <SidebarGroupLabel className="px-2 text-xs font-semibold tracking-[0.08em] text-slate-400 uppercase">
            Reference
          </SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">{resourceItems.map(renderItem)}</SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border/70 gap-1 border-t px-2 py-2">
        {settingsItem && <SidebarMenu className="gap-0.5">{renderItem(settingsItem)}</SidebarMenu>}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
