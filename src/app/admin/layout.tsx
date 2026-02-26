'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { getTeamPermissions, type TeamRole, type TeamPermissions } from '@/lib/team-permissions'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs'
import { CommandPalette } from '@/components/admin/command-palette'

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

  return (
    <div className="flex min-h-screen">
      <AdminSidebar isAppAdmin={isAppAdmin} permissions={permissions} />
      <main className="flex-1 min-w-0">
        <div className="px-6 pt-6 flex items-center justify-between">
          <AdminBreadcrumbs />
          <CommandPalette />
        </div>
        {children}
      </main>
    </div>
  )
}
