'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, Shield } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function UserNav() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.error('Error checking admin role:', error)
        setIsAdmin(false)
        return
      }
      
      setIsAdmin(roleData?.role === 'admin')
    } catch (err) {
      console.error('Admin role check failed:', err)
      setIsAdmin(false)
    }
  }, [supabase])

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error getting user:', error)
          setUser(null)
          setIsLoading(false)
          return
        }
        
        setUser(user)

        if (user) {
          await checkAdminRole(user.id)
        }
      } catch (err) {
        console.error('getUser failed:', err)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsAdmin(false)
        setIsLoading(false)
        return
      }
      
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await checkAdminRole(session.user.id)
      } else {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, checkAdminRole])

  const handleSignOut = async () => {
    try {
      // Clear local state first for immediate UI feedback
      setUser(null)
      setIsAdmin(false)
      
      // Then sign out from Supabase
      await supabase.auth.signOut()
      
      // Navigate to home
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  if (isLoading) {
    return <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" data-testid="button-sign-in">
            Sign In
          </Button>
        </Link>
        <Link href="/signup">
          <Button data-testid="button-get-started">
            Get Started
          </Button>
        </Link>
      </div>
    )
  }

  const avatarUrl = user.user_metadata?.avatar_url
  const userInitials = user.email?.substring(0, 2).toUpperCase() || 'U'
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer" data-testid="menu-item-profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer" data-testid="menu-item-settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer" data-testid="menu-item-admin">
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut} 
          className="cursor-pointer text-destructive"
          data-testid="menu-item-sign-out"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}