'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookUser,
  DollarSign,
  CreditCard,
  Megaphone,
  Tag,
  Target,
  MessageSquare,
  ListChecks,
  FileText,
  Mail,
  Paintbrush,
  Palette,
  Globe,
  FileCode,
  Layers,
  Zap,
  Share2,
  HelpCircle,
  Link2,
  Star,
  Image,
  Shield,
  Rocket,
  Settings,
  ScrollText,
  Key,
  TrendingUp,
  BarChart3,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  LogOut,
  Clock,
  type LucideIcon,
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
  SidebarMenuBadge,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { TeamPermissions } from '@/lib/team-permissions'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  permission?: (p: TeamPermissions | null, isAdmin: boolean) => boolean
  badgeKey?: string
}

interface NavGroup {
  group: string
  groupIcon: LucideIcon
  items: NavItem[]
}

interface BadgeCounts {
  openTickets: number
  newUsersToday: number
  failedPayments: number
  pendingApplications: number
  pendingPayouts: number
}

const RECENT_PAGES_KEY = 'admin-recent-pages'
const MAX_RECENT = 5

interface RecentPage {
  href: string
  title: string
  timestamp: number
}

function buildNavGroups(isAppAdmin: boolean, permissions: TeamPermissions | null): NavGroup[] {
  const can = (check: (p: TeamPermissions | null, isAdmin: boolean) => boolean) => check(permissions, isAppAdmin)

  const allGroups: (NavGroup & { visible?: boolean })[] = [
    {
      group: 'Dashboard',
      groupIcon: LayoutDashboard,
      items: [
        { title: 'Overview', href: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      group: 'People',
      groupIcon: Users,
      items: [
        { title: 'Users', href: '/admin/users', icon: Users, permission: (p, a) => a || !!p?.canManageUsers, badgeKey: 'newUsersToday' },
        { title: 'Team', href: '/admin/team', icon: UserCog, permission: (p, a) => a || !!p?.canManageTeam },
        { title: 'CRM', href: '/admin/crm', icon: BookUser, permission: (p, a) => a || !!p?.canManageUsers },
      ],
    },
    {
      group: 'Money',
      groupIcon: DollarSign,
      items: [
        { title: 'Revenue', href: '/admin/revenue', icon: DollarSign, permission: (p, a) => a || !!p?.canViewAnalytics, badgeKey: 'failedPayments' },
        { title: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard, permission: (p, a) => a || !!p?.canViewAnalytics },
      ],
    },
    {
      group: 'Affiliates',
      groupIcon: Megaphone,
      visible: isAppAdmin || !!permissions?.canEditSettings,
      items: [
        { title: 'Affiliate Program', href: '/admin/setup/affiliate', icon: Megaphone, permission: (p, a) => a || !!p?.canEditSettings, badgeKey: 'pendingApplications' },
        { title: 'Discount Codes', href: '/admin/setup/discount-codes', icon: Tag, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Onboarding Funnel', href: '/admin/setup/funnel', icon: Target, permission: (p, a) => a || !!p?.canEditSettings },
      ],
    },
    {
      group: 'Support',
      groupIcon: MessageSquare,
      visible: isAppAdmin || !!permissions?.canManageUsers,
      items: [
        { title: 'Tickets', href: '/admin/feedback', icon: MessageSquare, permission: (p, a) => a || !!p?.canManageUsers, badgeKey: 'openTickets' },
        { title: 'Waitlist', href: '/admin/waitlist', icon: ListChecks, permission: (p, a) => a || !!p?.canManageUsers },
      ],
    },
    {
      group: 'Content',
      groupIcon: FileText,
      visible: isAppAdmin || !!permissions?.canEditContent || !!permissions?.canManageUsers,
      items: [
        { title: 'Blog', href: '/admin/blog', icon: FileText, permission: (p, a) => a || !!p?.canEditContent },
        { title: 'Email Templates', href: '/admin/email-templates', icon: Mail, permission: (p, a) => a || !!p?.canEditContent },
      ],
    },
    {
      group: 'Settings',
      groupIcon: Settings,
      visible: isAppAdmin || !!permissions?.canEditSettings,
      items: [
        { title: 'Branding', href: '/admin/setup/branding', icon: Paintbrush, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Color Palette', href: '/admin/setup/palette', icon: Palette, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Homepage', href: '/admin/setup/content', icon: Globe, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Pages', href: '/admin/setup/pages', icon: FileCode, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Pricing', href: '/admin/setup/pricing', icon: DollarSign, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Products', href: '/admin/setup/products', icon: Layers, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Features', href: '/admin/setup/features', icon: Zap, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Social Links', href: '/admin/setup/social', icon: Share2, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Support Config', href: '/admin/setup/support', icon: HelpCircle, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Integrations', href: '/admin/setup/integrations', icon: Link2, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Testimonials', href: '/admin/setup/testimonials', icon: Star, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Watermark', href: '/admin/setup/watermark', icon: Image, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Compliance', href: '/admin/setup/compliance', icon: Shield, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Security', href: '/admin/setup/security', icon: Shield, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'PassivePost', href: '/admin/setup/passivepost', icon: Rocket, permission: (p, a) => a || !!p?.canEditSettings },
      ],
    },
    {
      group: 'System',
      groupIcon: BarChart3,
      visible: isAppAdmin || !!permissions?.canManageUsers || !!permissions?.canManageTeam || !!permissions?.canViewAnalytics,
      items: [
        { title: 'Analytics', href: '/admin/analytics', icon: TrendingUp, permission: (p, a) => a || !!p?.canViewAnalytics },
        { title: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText, permission: (p, a) => a || !!p?.canViewAnalytics },
        { title: 'Queue', href: '/admin/queue', icon: Layers, permission: (_, a) => a },
        { title: 'SSO', href: '/admin/sso', icon: Key, permission: (_, a) => a },
        { title: 'Onboarding Wizard', href: '/admin/onboarding', icon: Rocket, permission: (p, a) => a || !!p?.canEditSettings },
        { title: 'Metrics', href: '/admin/metrics', icon: BarChart3, permission: (_, a) => a },
      ],
    },
  ]

  return allGroups
    .filter(g => g.visible !== false)
    .map(g => ({
      group: g.group,
      groupIcon: g.groupIcon,
      items: g.items.filter(item => {
        if (!item.permission) return true
        return item.permission(permissions, isAppAdmin)
      }),
    }))
    .filter(g => g.items.length > 0)
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(href + '/')
}

const ROUTE_TITLE_MAP: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/users': 'Users',
  '/admin/team': 'Team',
  '/admin/crm': 'CRM',
  '/admin/revenue': 'Revenue',
  '/admin/subscriptions': 'Subscriptions',
  '/admin/setup/affiliate': 'Affiliate Program',
  '/admin/setup/discount-codes': 'Discount Codes',
  '/admin/setup/funnel': 'Onboarding Funnel',
  '/admin/feedback': 'Tickets',
  '/admin/waitlist': 'Waitlist',
  '/admin/blog': 'Blog',
  '/admin/email-templates': 'Email Templates',
  '/admin/setup/branding': 'Branding',
  '/admin/setup/palette': 'Color Palette',
  '/admin/setup/content': 'Homepage',
  '/admin/setup/pages': 'Pages',
  '/admin/setup/pricing': 'Pricing',
  '/admin/setup/products': 'Products',
  '/admin/setup/features': 'Features',
  '/admin/setup/social': 'Social Links',
  '/admin/setup/support': 'Support Config',
  '/admin/setup/integrations': 'Integrations',
  '/admin/setup/testimonials': 'Testimonials',
  '/admin/setup/watermark': 'Watermark',
  '/admin/setup/compliance': 'Compliance',
  '/admin/setup/security': 'Security',
  '/admin/setup/passivepost': 'PassivePost',
  '/admin/analytics': 'Analytics',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/queue': 'Queue',
  '/admin/sso': 'SSO',
  '/admin/onboarding': 'Onboarding Wizard',
  '/admin/metrics': 'Metrics',
  '/admin/affiliate': 'Affiliate Program',
}

function getRecentPages(): RecentPage[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RECENT_PAGES_KEY)
    if (!stored) return []
    return JSON.parse(stored) as RecentPage[]
  } catch {
    return []
  }
}

function addRecentPage(href: string, title: string) {
  if (typeof window === 'undefined') return
  try {
    const pages = getRecentPages().filter(p => p.href !== href)
    pages.unshift({ href, title, timestamp: Date.now() })
    localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(pages.slice(0, MAX_RECENT)))
  } catch {}
}

function findGroupForPath(navGroups: NavGroup[], pathname: string): string | null {
  if (pathname === '/admin') return null
  for (const group of navGroups) {
    if (group.group === 'Dashboard') continue
    for (const item of group.items) {
      if (isActive(pathname, item.href)) return group.group
    }
  }
  return null
}

function getGroupBadgeTotal(group: NavGroup, badgeCounts: BadgeCounts): number {
  let total = 0
  for (const item of group.items) {
    if (item.badgeKey) {
      total += (badgeCounts as any)[item.badgeKey] || 0
    }
  }
  return total
}

interface AdminSidebarNavProps {
  isAppAdmin: boolean
  permissions: TeamPermissions | null
}

export function AdminSidebarNav({ isAppAdmin, permissions }: AdminSidebarNavProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({ openTickets: 0, newUsersToday: 0, failedPayments: 0, pendingApplications: 0, pendingPayouts: 0 })
  const [recentPages, setRecentPages] = useState<RecentPage[]>([])
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const manualOverrideRef = useRef(false)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  if (typeof window !== 'undefined' && !supabaseRef.current) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseRef.current = createClient()
    }
  }

  const navGroups = useMemo(() => buildNavGroups(isAppAdmin, permissions), [isAppAdmin, permissions])

  useEffect(() => {
    if (manualOverrideRef.current) {
      manualOverrideRef.current = false
      return
    }
    const detectedGroup = findGroupForPath(navGroups, pathname)
    setActiveGroup(detectedGroup)
  }, [pathname, navGroups])

  const handleBack = () => {
    manualOverrideRef.current = true
    setActiveGroup(null)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && activeGroup !== null) {
        e.preventDefault()
        handleBack()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeGroup])

  useEffect(() => {
    const supabase = supabaseRef.current
    if (!supabase) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => { subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch('/api/admin/sidebar-counts')
        if (res.ok) {
          const data = await res.json()
          setBadgeCounts(data)
        }
      } catch {}
    }
    fetchCounts()
  }, [])

  useEffect(() => {
    const title = ROUTE_TITLE_MAP[pathname]
    if (title) {
      addRecentPage(pathname, title)
    }
    setRecentPages(getRecentPages())
  }, [pathname])

  const handleSignOut = async () => {
    const supabase = supabaseRef.current
    if (!supabase) return
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'
  const initials = displayName.slice(0, 2).toUpperCase()
  const avatarUrl = user?.user_metadata?.avatar_url

  const filteredRecent = recentPages.filter(p => p.href !== pathname).slice(0, 3)

  const drilledGroup = activeGroup ? navGroups.find(g => g.group === activeGroup) : null

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/admin" className="flex items-center gap-2" data-testid="link-admin-home">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Settings className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Admin</span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {activeGroup === null ? (
          <>
            {filteredRecent.length > 0 && (
              <>
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <Clock className="h-3 w-3 mr-1" />
                    Recent
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {filteredRecent.map((page) => (
                        <SidebarMenuItem key={page.href}>
                          <SidebarMenuButton
                            asChild
                            size="sm"
                            data-testid={`nav-recent-${page.title.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Link href={page.href}>
                              <span className="text-muted-foreground">{page.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                <SidebarSeparator />
              </>
            )}

            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navGroups.map((group) => {
                    if (group.group === 'Dashboard') {
                      const overviewItem = group.items[0]
                      return (
                        <SidebarMenuItem key={group.group}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === '/admin'}
                            data-testid="nav-overview"
                          >
                            <Link href={overviewItem.href}>
                              <overviewItem.icon className="h-4 w-4" />
                              <span>{overviewItem.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    }

                    const groupBadge = getGroupBadgeTotal(group, badgeCounts)
                    const GroupIcon = group.groupIcon
                    const hasActiveChild = group.items.some(item => isActive(pathname, item.href))

                    return (
                      <SidebarMenuItem key={group.group}>
                        <SidebarMenuButton
                          onClick={() => setActiveGroup(group.group)}
                          isActive={hasActiveChild}
                          data-testid={`nav-group-${group.group.toLowerCase()}`}
                        >
                          <GroupIcon className="h-4 w-4" />
                          <span className="flex-1">{group.group}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                        </SidebarMenuButton>
                        {groupBadge > 0 && (
                          <SidebarMenuBadge data-testid={`badge-group-${group.group.toLowerCase()}`}>
                            {groupBadge}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : drilledGroup ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleBack}
                    data-testid="nav-back"
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="font-medium">{drilledGroup.group}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
            <SidebarSeparator className="my-1" />
            <SidebarGroupContent>
              <SidebarMenu>
                {drilledGroup.items.map((item) => {
                  const active = isActive(pathname, item.href)
                  const badgeCount = item.badgeKey ? (badgeCounts as any)[item.badgeKey] : 0
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
                      {badgeCount > 0 && (
                        <SidebarMenuBadge data-testid={`badge-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          {badgeCount}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="border-t pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 w-full rounded-md p-2 text-left text-sm hover-elevate"
                data-testid="button-admin-sidebar-user-menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{displayName}</span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-[--radix-dropdown-menu-trigger-width]">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" data-testid="link-admin-sidebar-profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/billing" data-testid="link-admin-sidebar-billing">Billing</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/social/overview" data-testid="link-admin-sidebar-social">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Social Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" data-testid="link-admin-sidebar-main-site">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Main Site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} data-testid="button-admin-sidebar-signout">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
