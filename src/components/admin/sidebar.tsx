'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  BookUser,
  DollarSign,
  CreditCard,
  BarChart3,
  MessageSquare,
  FileText,
  Mail,
  ListChecks,
  Megaphone,
  TrendingUp,
  Target,
  Palette,
  Paintbrush,
  Globe,
  FileCode,
  Tag,
  Settings,
  Shield,
  Link2,
  Image,
  Star,
  HelpCircle,
  Zap,
  Users,
  UserCog,
  ScrollText,
  Layers,
  Key,
  Rocket,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Share2,
} from 'lucide-react'
import type { TeamPermissions } from '@/lib/team-permissions'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  permission?: (p: TeamPermissions | null, isAdmin: boolean) => boolean
  badge?: number
}

interface NavGroup {
  label: string
  icon: React.ElementType
  permission?: (p: TeamPermissions | null, isAdmin: boolean) => boolean
  items: NavItem[]
}

type NavEntry = NavItem | NavGroup

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry
}

function buildNavEntries(badgeCounts: BadgeCounts): NavEntry[] {
  return [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      permission: () => true,
    },
    {
      label: 'CRM',
      href: '/admin/crm',
      icon: BookUser,
      permission: (p, isAdmin) => isAdmin || !!p?.canManageUsers,
      badge: badgeCounts.newUsersToday,
    },
    {
      label: 'Revenue',
      href: '/admin/revenue',
      icon: DollarSign,
      permission: (p, isAdmin) => isAdmin || !!p?.canViewAnalytics,
      badge: badgeCounts.failedPayments,
    },
    {
      label: 'Subscriptions',
      href: '/admin/subscriptions',
      icon: CreditCard,
      permission: (p, isAdmin) => isAdmin || !!p?.canViewAnalytics,
    },
    {
      label: 'Metrics',
      href: '/admin/metrics',
      icon: BarChart3,
      permission: (p, isAdmin) => isAdmin || !!p?.canViewAnalytics,
    },
    {
      label: 'Support',
      href: '/admin/feedback',
      icon: MessageSquare,
      permission: (p, isAdmin) => isAdmin || !!p?.canManageUsers,
      badge: badgeCounts.openTickets,
    },
    {
      label: 'Content',
      icon: FileText,
      permission: (p, isAdmin) => isAdmin || !!p?.canEditContent || !!p?.canManageUsers,
      items: [
        { label: 'Blog', href: '/admin/blog', icon: FileText, permission: (p, isAdmin) => isAdmin || !!p?.canEditContent },
        { label: 'Email Templates', href: '/admin/email-templates', icon: Mail, permission: (p, isAdmin) => isAdmin || !!p?.canEditContent },
        { label: 'Waitlist', href: '/admin/waitlist', icon: ListChecks, permission: (p, isAdmin) => isAdmin || !!p?.canManageUsers },
      ],
    },
    {
      label: 'Growth',
      icon: TrendingUp,
      permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings || !!p?.canViewAnalytics,
      items: [
        { label: 'Affiliate Program', href: '/admin/setup/affiliate', icon: Megaphone, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Discount Codes', href: '/admin/setup/discount-codes', icon: Tag, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp, permission: (p, isAdmin) => isAdmin || !!p?.canViewAnalytics },
        { label: 'Onboarding Funnel', href: '/admin/setup/funnel', icon: Target, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
      ],
    },
    {
      label: 'Settings',
      icon: Settings,
      permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings,
      items: [
        { label: 'Branding', href: '/admin/setup/branding', icon: Paintbrush, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Color Palette', href: '/admin/setup/palette', icon: Palette, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Homepage', href: '/admin/setup/content', icon: Globe, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Pages', href: '/admin/setup/pages', icon: FileCode, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Pricing', href: '/admin/setup/pricing', icon: DollarSign, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Products', href: '/admin/setup/products', icon: Layers, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Features', href: '/admin/setup/features', icon: Zap, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Social Links', href: '/admin/setup/social', icon: Share2, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Support Config', href: '/admin/setup/support', icon: HelpCircle, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Integrations', href: '/admin/setup/integrations', icon: Link2, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Testimonials', href: '/admin/setup/testimonials', icon: Star, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Watermark', href: '/admin/setup/watermark', icon: Image, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Compliance', href: '/admin/setup/compliance', icon: Shield, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'Security', href: '/admin/setup/security', icon: Shield, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
        { label: 'PassivePost', href: '/admin/setup/passivepost', icon: Rocket, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
      ],
    },
    {
      label: 'System',
      icon: Settings,
      permission: (p, isAdmin) => isAdmin || !!p?.canManageUsers || !!p?.canManageTeam || !!p?.canViewAnalytics,
      items: [
        { label: 'Users', href: '/admin/users', icon: Users, permission: (p, isAdmin) => isAdmin || !!p?.canManageUsers },
        { label: 'Team', href: '/admin/team', icon: UserCog, permission: (p, isAdmin) => isAdmin || !!p?.canManageTeam },
        { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText, permission: (p, isAdmin) => isAdmin || !!p?.canViewAnalytics },
        { label: 'Queue', href: '/admin/queue', icon: Layers, permission: (_, isAdmin) => isAdmin },
        { label: 'SSO', href: '/admin/sso', icon: Key, permission: (_, isAdmin) => isAdmin },
        { label: 'Onboarding Wizard', href: '/admin/onboarding', icon: Rocket, permission: (p, isAdmin) => isAdmin || !!p?.canEditSettings },
      ],
    },
  ]
}

interface BadgeCounts {
  openTickets: number
  newUsersToday: number
  failedPayments: number
}

interface AdminSidebarProps {
  isAppAdmin: boolean
  permissions: TeamPermissions | null
}

export function AdminSidebar({ isAppAdmin, permissions }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({ openTickets: 0, newUsersToday: 0, failedPayments: 0 })

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
    const entries = buildNavEntries(badgeCounts)
    for (const entry of entries) {
      if (isNavGroup(entry)) {
        const hasActiveChild = entry.items.some(item =>
          pathname === item.href || pathname.startsWith(item.href + '/')
        )
        if (hasActiveChild) {
          setExpandedGroups(prev => new Set([...prev, entry.label]))
        }
      }
    }
  }, [pathname, badgeCounts])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  function toggleGroup(label: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  function canSee(entry: NavEntry) {
    if (!entry.permission) return true
    return entry.permission(permissions, isAppAdmin)
  }

  const navEntries = buildNavEntries(badgeCounts)

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={cn(
        'flex items-center border-b h-14 px-3',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <span className="font-semibold text-sm text-foreground" data-testid="text-admin-sidebar-title">Admin</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 hidden lg:flex"
          onClick={() => setCollapsed(!collapsed)}
          data-testid="button-toggle-sidebar"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5" data-testid="nav-admin-sidebar">
        {navEntries.map(entry => {
          if (!canSee(entry)) return null

          if (!isNavGroup(entry)) {
            return (
              <Link key={entry.label} href={entry.href} data-testid={`link-sidebar-${entry.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(entry.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )}>
                  <entry.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{entry.label}</span>
                      {entry.badge && entry.badge > 0 ? (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground" data-testid={`badge-sidebar-${entry.label.toLowerCase().replace(/\s+/g, '-')}`}>
                          {entry.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                  {collapsed && entry.badge && entry.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                      {entry.badge}
                    </span>
                  ) : null}
                </div>
              </Link>
            )
          }

          const isExpanded = expandedGroups.has(entry.label)
          const hasActiveChild = entry.items.some(item => isActive(item.href))

          return (
            <div key={entry.label}>
              <button
                onClick={() => toggleGroup(entry.label)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium w-full transition-colors',
                  hasActiveChild
                    ? 'text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )}
                data-testid={`button-sidebar-group-${entry.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <entry.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-left">{entry.label}</span>
                    {isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                  </>
                )}
              </button>

              {!collapsed && isExpanded && (
                <div className="ml-4 pl-3 border-l border-border space-y-0.5 mt-0.5">
                  {entry.items.map(item => {
                    if (!canSee(item)) return null
                    return (
                      <Link key={item.label} href={item.href} data-testid={`link-sidebar-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                        <div className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors',
                          isActive(item.href)
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}>
                          <item.icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden h-9 w-9"
        onClick={() => setMobileOpen(true)}
        data-testid="button-mobile-menu"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" data-testid="overlay-mobile-sidebar">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-card border-r shadow-xl z-50">
            <div className="absolute top-3 right-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(false)} data-testid="button-close-mobile-menu" aria-label="Close navigation menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      <aside
        className={cn(
          'hidden lg:flex flex-col border-r bg-card shrink-0 h-[calc(100vh-0px)] sticky top-0 transition-all duration-200',
          collapsed ? 'w-14' : 'w-56'
        )}
        data-testid="aside-admin-sidebar"
      >
        {sidebarContent}
      </aside>
    </>
  )
}
