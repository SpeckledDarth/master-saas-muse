'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from '@supabase/supabase-js'
import { Shield, CalendarDays, Users, User as UserIcon } from 'lucide-react'

interface MembershipData {
  hasAdminAccess: boolean
  isAppAdmin: boolean
  isAffiliate: boolean
  userRole: string
  teamRole: string | null
}

const defaultMembership: MembershipData = {
  hasAdminAccess: false,
  isAppAdmin: false,
  isAffiliate: false,
  userRole: 'user',
  teamRole: null,
}

export function UserNav() {
  const [user, setUser] = useState<User | null>(null)
  const [membership, setMembership] = useState<MembershipData>(defaultMembership)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  
  if (typeof window !== 'undefined' && !supabaseRef.current) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseRef.current = createClient()
    }
  }
  
  const supabase = supabaseRef.current

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session) {
        setMembership(defaultMembership)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])
  
  useEffect(() => {
    if (!user) {
      setMembership(defaultMembership)
      return
    }
    
    const checkRole = async () => {
      try {
        const response = await fetch('/api/user/membership')
        if (response.ok) {
          const data = await response.json()
          setMembership({
            hasAdminAccess: data.hasAdminAccess ?? false,
            isAppAdmin: data.isAppAdmin ?? false,
            isAffiliate: data.isAffiliate ?? false,
            userRole: data.userRole ?? 'user',
            teamRole: data.teamRole ?? null,
          })
        } else {
          setMembership(defaultMembership)
        }
      } catch {
        setMembership(defaultMembership)
      }
    }
    
    checkRole()
  }, [user])

  const handleSignOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setMembership(defaultMembership)
    router.push('/')
    router.refresh()
  }, [supabase, router])

  if (loading) {
    return <Button variant="ghost" size="sm" disabled>Loading...</Button>
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild data-testid="button-login">
          <Link href="/login">Log in</Link>
        </Button>
        <Button size="sm" asChild data-testid="button-signup">
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    )
  }

  const initials = user.email?.slice(0, 2).toUpperCase() || 'U'
  const isAffiliateOnly = membership.isAffiliate && !membership.hasAdminAccess
  const showProductDashboard = !isAffiliateOnly
  const showBilling = !isAffiliateOnly
  const showAffiliateDashboard = membership.isAffiliate || membership.isAppAdmin

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {membership.hasAdminAccess && (
          <DropdownMenuItem asChild>
            <Link href="/admin" data-testid="link-admin" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        {showProductDashboard && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard/social/overview" data-testid="link-passivepost" className="flex items-center">
              <CalendarDays className="mr-2 h-4 w-4" />
              PassivePost
            </Link>
          </DropdownMenuItem>
        )}
        {showAffiliateDashboard && (
          <DropdownMenuItem asChild>
            <Link href="/affiliate/dashboard" data-testid="link-affiliate" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Affiliate Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/profile" data-testid="link-profile" className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        {showBilling && (
          <DropdownMenuItem asChild>
            <Link href="/billing" data-testid="link-billing">Billing</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} data-testid="button-signout">
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
