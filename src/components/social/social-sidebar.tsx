'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  Clock,
  CalendarDays,
  BarChart3,
  Target,
  Palette,
  Link2,
  Settings,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  LogOut,
  ChevronUp,
  BookOpen,
  Pen,
  Library,
  Brain,
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
    group: 'Blog',
    items: [
      { title: 'Blog Home', href: '/dashboard/social/blog', icon: BookOpen, exact: true },
      { title: 'Compose', href: '/dashboard/social/blog/compose', icon: Pen },
      { title: 'Articles', href: '/dashboard/social/blog/posts', icon: Library },
    ],
  },
  {
    group: 'Insights',
    items: [
      { title: 'Engagement', href: '/dashboard/social/engagement', icon: BarChart3 },
      { title: 'Intelligence', href: '/dashboard/social/intelligence', icon: Brain },
      { title: 'Leads', href: '/dashboard/social/leads', icon: Target },
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
  const [user, setUser] = useState<User | null>(null)
  const [tierName, setTierName] = useState('Starter')
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  if (typeof window !== 'undefined' && !supabaseRef.current) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseRef.current = createClient()
    }
  }

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
    fetch('/api/social/tier').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.tier) {
        const TIER_DISPLAY: Record<string, string> = { starter: 'Starter', basic: 'Basic', premium: 'Premium', universal: 'Universal', power: 'Power' }
        setTierName(TIER_DISPLAY[data.tier] || data.tier)
      }
    }).catch(() => {})
  }, [])

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const avatarUrl = user?.user_metadata?.avatar_url

  const handleSignOut = async () => {
    const supabase = supabaseRef.current
    if (!supabase) return
    await supabase.auth.signOut()
    window.location.href = '/'
  }

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
      <SidebarFooter className="p-4 space-y-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-testid="nav-back-dashboard">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="border-t pt-3 mt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 w-full rounded-md p-2 text-left text-sm hover-elevate"
                data-testid="button-sidebar-user-menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{displayName}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{tierName}</Badge>
                  </div>
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
                <Link href="/profile" data-testid="link-sidebar-profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/billing" data-testid="link-sidebar-billing">Billing</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" data-testid="link-sidebar-main-site">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Main Site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} data-testid="button-sidebar-signout">
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
