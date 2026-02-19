'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  Clock,
  CalendarDays,
  BarChart3,
  Palette,
  Link2,
  Settings,
  Sparkles,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'

const NAV_ITEMS = [
  {
    group: 'Dashboard',
    items: [
      { title: 'Overview', href: '/dashboard/social/overview', icon: LayoutDashboard },
      { title: 'Posts', href: '/dashboard/social/posts', icon: FileText },
      { title: 'Queue', href: '/dashboard/social/queue', icon: Clock },
      { title: 'Calendar', href: '/dashboard/social/calendar', icon: CalendarDays },
    ],
  },
  {
    group: 'Insights',
    items: [
      { title: 'Engagement', href: '/dashboard/social/engagement', icon: BarChart3 },
    ],
  },
  {
    group: 'Setup',
    items: [
      { title: 'Brand Voice', href: '/dashboard/social/brand', icon: Palette },
      { title: 'Accounts', href: '/dashboard/social', icon: Link2, exact: true },
      { title: 'Settings', href: '/dashboard/social/settings', icon: Settings },
    ],
  },
]

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

export function SocialSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard/social/overview" className="flex items-center gap-2" data-testid="link-social-home">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">PassivePost</span>
            <span className="text-xs text-muted-foreground">Social Manager</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV_ITEMS.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href, item.exact)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/dashboard/social/onboarding'}
              data-testid="nav-onboarding"
            >
              <Link href="/dashboard/social/onboarding">
                <Sparkles className="h-4 w-4" />
                <span>Setup Wizard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="border-t pt-2 mt-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild data-testid="nav-back-dashboard">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild data-testid="nav-back-main-site">
                <Link href="/">
                  <ExternalLink className="h-4 w-4" />
                  <span>Main Site</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
