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
      'h-9 rounded-md px-2.5 text-[13px] text-sidebar-foreground/75 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-[#F5E7FF] data-[active=true]:font-semibold data-[active=true]:text-[#5B148F]'

    if (hasChildren) {
      return (
        <SidebarMenuItem key={path}>
          <SidebarMenuButton
            type="button"
            isActive={isActive}
            tooltip={label}
            className={itemClassName}
            onClick={() =>
              setExpandedGroups((current) => ({ ...current, [path]: !expanded }))
            }
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
                      className="h-8 rounded-md text-xs text-sidebar-foreground/65 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-[#F5E7FF] data-[active=true]:font-semibold data-[active=true]:text-[#5B148F]"
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
    <Sidebar collapsible="icon" className="overflow-x-hidden border-slate-200/80">
      <SidebarHeader className="h-12 min-h-12 gap-0 overflow-hidden border-b border-sidebar-border/70 p-0">
        <SidebarMenu className="h-full gap-0">
          <SidebarMenuItem className="flex h-full items-center">
            <SidebarMenuButton
              size="lg"
              className="h-full gap-2.5 rounded-md px-2 text-[13px] font-semibold tracking-[-0.01em] text-slate-800 transition-colors duration-150 hover:bg-slate-50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
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
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Workspace
          </SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">{primaryItems.map(renderItem)}</SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="mx-2" />

        <SidebarGroup className="px-2 py-3">
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Resources
          </SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">{resourceItems.map(renderItem)}</SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-1 border-t border-sidebar-border/70 px-2 py-2">
        {settingsItem && (
          <SidebarMenu className="gap-0.5">{renderItem(settingsItem)}</SidebarMenu>
        )}
        <SidebarSeparator className="mx-0 my-1" />
        <div className="flex h-10 items-center gap-2 rounded-md px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
            SB
          </span>
          <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold text-slate-700">Simulation Builder</p>
            <p className="truncate text-[10px] text-slate-400">Workspace</p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
