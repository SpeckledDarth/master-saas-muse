'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      if (role?.role !== 'admin') {
        router.push('/')
        return
      }
      
      setIsAdmin(true)
      setLoading(false)
    }
    
    checkAdmin()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 h-14">
            <Button 
              variant={pathname === '/admin' ? 'secondary' : 'ghost'} 
              size="sm" 
              asChild
            >
              <Link href="/admin" data-testid="link-admin-home">
                Admin
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                variant={pathname === '/admin/setup' ? 'secondary' : 'ghost'} 
                size="sm" 
                asChild
              >
                <Link href="/admin/setup" data-testid="link-admin-setup">
                  Setup
                </Link>
              </Button>
              <Button 
                variant={pathname === '/admin/users' ? 'secondary' : 'ghost'} 
                size="sm" 
                asChild
              >
                <Link href="/admin/users" data-testid="link-admin-users">
                  Users
                </Link>
              </Button>
              <Button 
                variant={pathname === '/admin/team' ? 'secondary' : 'ghost'} 
                size="sm" 
                asChild
              >
                <Link href="/admin/team" data-testid="link-admin-team">
                  Team
                </Link>
              </Button>
              <Button 
                variant={pathname === '/admin/content' ? 'secondary' : 'ghost'} 
                size="sm" 
                asChild
              >
                <Link href="/admin/content" data-testid="link-admin-content">
                  Content
                </Link>
              </Button>
              <Button 
                variant={pathname === '/admin/analytics' ? 'secondary' : 'ghost'} 
                size="sm" 
                asChild
              >
                <Link href="/admin/analytics" data-testid="link-admin-analytics">
                  Analytics
                </Link>
              </Button>
              <Button 
                variant={pathname === '/admin/feedback' ? 'secondary' : 'ghost'} 
                size="sm" 
                asChild
              >
                <Link href="/admin/feedback" data-testid="link-admin-feedback">
                  Feedback
                </Link>
              </Button>
              <Button 
                variant={pathname === '/admin/waitlist' ? 'secondary' : 'ghost'} 
                size="sm" 
                asChild
              >
                <Link href="/admin/waitlist" data-testid="link-admin-waitlist">
                  Waitlist
                </Link>
              </Button>
              <Button 
                variant={pathname === '/admin/email-templates' ? 'secondary' : 'ghost'} 
                size="sm" 
                asChild
              >
                <Link href="/admin/email-templates" data-testid="link-admin-emails">
                  Emails
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
