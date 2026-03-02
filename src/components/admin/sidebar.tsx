'use client'

import { useState, useEffect, useRef, type ElementType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  BookUser,
  DollarSign,
  CreditCard,
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
  Menu,
  X,
  Share2,
  ChevronDown,
  Briefcase,
} from 'lucide-react'
import type { TeamPermissions } from '@/lib/team-permissions'

interface NavItem {
  label: string
  href: string
  icon: ElementType
  permission?: (p: TeamPermissions | null, isAdmin: boolean) => boolean
  badge?: number
}

interface NavSection {
  label: string
  icon: ElementType
  permission?: (p: TeamPermissions | null, isAdmin: boolean) => boolean
  items: NavItem[]
}

interface BadgeCounts {
  openTickets: number
  newUsersToday: number
  failedPayments: number
}

function buildSections(badgeCounts: BadgeCounts): NavSection[] {
  return [
    {
      label: 'Business',
      icon: Briefcase,
      permission: () => true,
      items: [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, permission: () => true },
        { label: 'CRM', href: '/admin/crm', icon: BookUser, permission: (p, isAdmin) => isAdmin || !!p?.canManageUsers, badge: badgeCounts.newUsersToday },
        { label: 'Revenue', href: '/admin/revenue', icon: DollarSign, permission: (p, isAdmin) => isAdmin || !!p?.canViewAnalytics, badge: badgeCounts.failedPayments },
        { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard, permission: (p, isAdmin) => isAdmin || !!p?.canViewAnalytics },
      ],
    },
    {
      label: 'Support',
      icon: MessageSquare,
      permission: (p, isAdmin) => isAdmin || !!p?.canManageUsers,
      items: [
        { label: 'Tickets', href: '/admin/feedback', icon: MessageSquare, permission: (p, isAdmin) => isAdmin || !!p?.canManageUsers, badge: badgeCounts.openTickets },
        { label: 'Waitlist', href: '/admin/waitlist', icon: ListChecks, permission: (p, isAdmin) => isAdmin || !!p?.canManageUsers },
      ],
    },
    {
      label: 'Content',
      icon: FileText,
      permission: (p, isAdmin) => isAdmin || !!p?.canEditContent || !!p?.canManageUsers,
      items: [
        { label: 'Blog', href: '/admin/blog', icon: FileText, permission: (p, isAdmin) => isAdmin || !!p?.canEditContent },
        { label: 'Email Templates', href: '/admin/email-templates', icon: Mail, permission: (p, isAdmin) => isAdmin || !!p?.canEditContent },
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

function findActiveSection(sections: NavSection[], pathname: string): string {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.href === '/admin' && pathname === '/admin') return section.label
      if (item.href !== '/admin' && (pathname === item.href || pathname.startsWith(item.href + '/'))) {
        return section.label
      }
    }
  }
  return sections[0]?.label || 'Business'
}

interface AdminSidebarProps {
  isAppAdmin: boolean
  permissions: TeamPermissions | null
}

export function AdminSidebar({ isAppAdmin, permissions }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({ openTickets: 0, newUsersToday: 0, failedPayments: 0 })
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    setMobileOpen(false)
    setOpenDropdown(null)
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  const sections = buildSections(badgeCounts)
  const activeSection = findActiveSection(sections, pathname)

  function canSeeSection(section: NavSection) {
    if (!section.permission) return true
    return section.permission(permissions, isAppAdmin)
  }

  function canSeeItem(item: NavItem) {
    if (!item.permission) return true
    return item.permission(permissions, isAppAdmin)
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const visibleSections = sections.filter(canSeeSection)
  const currentSection = visibleSections.find(s => s.label === activeSection) || visibleSections[0]
  const currentItems = currentSection?.items.filter(canSeeItem) || []

  const totalBadge = (section: NavSection) => {
    return section.items.reduce((sum, item) => sum + (canSeeItem(item) && item.badge ? item.badge : 0), 0)
  }

  const topNav = (
    <nav className="border-b bg-background" data-testid="nav-admin-topbar" ref={dropdownRef}>
      <div className="flex items-center gap-1 px-[var(--card-padding,1.25rem)] h-11">
        {visibleSections.map(section => {
          const Icon = section.icon
          const isCurrent = section.label === activeSection
          const badge = totalBadge(section)
          const isDropdownOpen = openDropdown === section.label
          const visibleItems = section.items.filter(canSeeItem)

          return (
            <div key={section.label} className="relative">
              <button
                onClick={() => {
                  setOpenDropdown(isDropdownOpen ? null : section.label)
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--btn-radius,9999px)] text-sm font-medium transition-colors whitespace-nowrap',
                  isCurrent
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                data-testid={`button-topnav-${section.label.toLowerCase()}`}
                aria-label={section.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{section.label}</span>
                {badge > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground" data-testid={`badge-topnav-${section.label.toLowerCase()}`}>
                    {badge}
                  </span>
                )}
                <ChevronDown className={cn('h-3 w-3 shrink-0 transition-transform', isDropdownOpen && 'rotate-180')} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] rounded-[var(--card-radius,0.75rem)] border bg-popover p-1 shadow-[var(--card-shadow)]" data-testid={`dropdown-${section.label.toLowerCase()}`}>
                  {visibleItems.map(item => {
                    const ItemIcon = item.icon
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors',
                          isActive(item.href)
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-popover-foreground hover:bg-muted'
                        )}
                        data-testid={`link-dropdown-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <ItemIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && item.badge > 0 ? (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-0.5 px-[var(--card-padding,1.25rem)] h-9 border-t bg-muted/30 overflow-x-auto scrollbar-hide" data-testid="nav-admin-subnav">
        {currentItems.map(item => {
          const ItemIcon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--btn-radius,9999px)] text-xs font-medium transition-colors whitespace-nowrap',
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              data-testid={`link-subnav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <ItemIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground" data-testid={`badge-subnav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </div>
    </nav>
  )

  const mobileSidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b h-14 px-3">
        <span className="font-semibold text-sm text-foreground" data-testid="text-admin-mobile-title">Admin</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(false)} data-testid="button-close-mobile-menu" aria-label="Close navigation menu">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-3" data-testid="nav-admin-mobile">
        {visibleSections.map(section => {
          const SectionIcon = section.icon
          return (
            <div key={section.label}>
              <div className="flex items-center gap-2 px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <SectionIcon className="h-3.5 w-3.5" />
                {section.label}
              </div>
              <div className="space-y-0.5 mt-1">
                {section.items.filter(canSeeItem).map(item => {
                  const ItemIcon = item.icon
                  return (
                    <Link key={item.label} href={item.href} data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      <div className={cn(
                        'flex items-center gap-[var(--content-density-gap,1rem)] rounded-[var(--btn-radius,9999px)] px-3 py-2 text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}>
                        <ItemIcon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && item.badge > 0 ? (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  )
                })}
              </div>
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
          <div className="fixed inset-y-0 left-0 w-72 bg-background border-r shadow-[var(--card-shadow)] z-50">
            {mobileSidebarContent}
          </div>
        </div>
      )}

      <div className="hidden lg:block" data-testid="admin-topnav-wrapper">
        {topNav}
      </div>
    </>
  )
}
