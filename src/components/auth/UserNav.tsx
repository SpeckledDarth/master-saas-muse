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
import { Shield, CalendarDays } from 'lucide-react'

export function UserNav() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasAdminAccess, setHasAdminAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  
  // Create supabase client once
  if (typeof window !== 'undefined' && !supabaseRef.current) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseRef.current = createClient()
    }
  }
  
  const supabase = supabaseRef.current

  // Effect 1: Get initial session and subscribe to auth changes
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session) {
        setIsAdmin(false)
        setHasAdminAccess(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])
  
  // Effect 2: Check role whenever user changes (via API to bypass RLS)
  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setHasAdminAccess(false)
      return
    }
    
    const checkRole = async () => {
      try {
        const response = await fetch('/api/user/membership')
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAppAdmin)
          setHasAdminAccess(data.hasAdminAccess)
        } else {
          setIsAdmin(false)
          setHasAdminAccess(false)
        }
      } catch {
        setIsAdmin(false)
        setHasAdminAccess(false)
      }
    }
    
    checkRole()
  }, [user])

  const handleSignOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setIsAdmin(false)
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
        {hasAdminAccess && (
          <DropdownMenuItem asChild>
            <Link href="/admin" data-testid="link-admin" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/dashboard/social/overview" data-testid="link-socioscheduler" className="flex items-center">
            <CalendarDays className="mr-2 h-4 w-4" />
            SocioScheduler
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile" data-testid="link-profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/billing" data-testid="link-billing">Billing</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} data-testid="button-signout">
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
