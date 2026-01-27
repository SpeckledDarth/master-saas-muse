'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
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
import { Shield } from 'lucide-react'

export function UserNav() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const router = useRouter()

  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
    return createClient()
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setDebugInfo('No Supabase client')
      return
    }
    
    // Safety timeout - ensure loading stops after 5 seconds max
    const timeoutId = setTimeout(() => {
      setLoading(false)
      setDebugInfo('Timeout - auth check took too long')
    }, 5000)
    
    // Use getSession first (faster, uses cached session)
    const getUser = async () => {
      try {
        // getSession is faster than getUser for initial load
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user ?? null
        setUser(currentUser)
        
        if (currentUser) {
          setDebugInfo(`User: ${currentUser.id.slice(0,8)}...`)
          
          const { data: role, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', currentUser.id)
            .single()
          
          if (roleError) {
            setDebugInfo(`Role error: ${roleError.message}`)
          } else {
            setDebugInfo(`Role: ${role?.role || 'none'}`)
            setIsAdmin(role?.role === 'admin')
          }
        } else {
          setDebugInfo('No user session')
        }
      } catch (error) {
        setDebugInfo(`Error: ${error}`)
      } finally {
        clearTimeout(timeoutId)
        setLoading(false)
      }
    }
    
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        setDebugInfo(`Checking role for ${session.user.id.slice(0,8)}...`)
        const { data: role, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
        
        if (error) {
          setDebugInfo(`Role error: ${error.message}`)
          setIsAdmin(false)
        } else {
          setDebugInfo(`Role: ${role?.role || 'none'}`)
          setIsAdmin(role?.role === 'admin')
        }
      } else {
        setDebugInfo('No session')
        setIsAdmin(false)
      }
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [supabase])

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

  // Temporary debug display - remove after fixing
  const showDebug = process.env.NODE_ENV === 'development' || debugInfo.includes('error') || debugInfo.includes('Error')

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
            {debugInfo && (
              <p className="text-xs leading-none text-yellow-500 mt-1">[Debug: {debugInfo}]</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin" data-testid="link-admin" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}
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
