'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { getTeamPermissions, type TeamRole, type TeamPermissions } from '@/lib/team-permissions'
import { AdminSidebarNav } from '@/components/admin/admin-sidebar'
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs'
import { CommandPalette } from '@/components/admin/command-palette'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [isAppAdmin, setIsAppAdmin] = useState(false)
  const [permissions, setPermissions] = useState<TeamPermissions | null>(null)

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      try {
        const response = await fetch('/api/user/membership')
        if (!response.ok) {
          router.push('/')
          return
        }
        
        const data = await response.json()
        
        if (data.isAppAdmin) {
          setIsAppAdmin(true)
          setHasAccess(true)
          setPermissions(getTeamPermissions('owner'))
          setLoading(false)
          return
        }
        
        if (data.teamRole) {
          const teamRole = data.teamRole as TeamRole
          const teamPermissions = getTeamPermissions(teamRole)
          
          if (teamRole === 'viewer') {
            router.push('/')
            return
          }
          
          setPermissions(teamPermissions)
          setHasAccess(true)
          setLoading(false)
          return
        }
        
        router.push('/')
      } catch (error) {
        console.error('Error checking access:', error)
        router.push('/')
      }
    }
    
    checkAccess()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  const sidebarStyle = {
    '--sidebar-width': '16rem',
    '--sidebar-width-icon': '3rem',
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AdminSidebarNav isAppAdmin={isAppAdmin} permissions={permissions} />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 border-b px-4 py-2" data-testid="admin-content-header">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-admin-sidebar-toggle" className="md:hidden" />
              <AdminBreadcrumbs />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <CommandPalette />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
