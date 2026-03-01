'use client'

import { useState, useEffect } from 'react'
import { DSCard, DSCardContent, DSCardDescription, DSCardHeader, DSCardTitle } from '@/components/ui/ds-card'
import { Users, UserPlus, CreditCard, MessageSquare, TrendingUp, Mail, Clock } from 'lucide-react'

interface Stats {
  totalUsers: number
  newUsersThisMonth: number
  activeSubscriptions: number
  feedbackCount: number
  waitlistCount: number
  recentSignups: Array<{
    email: string
    created_at: string
  }>
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const [statsRes, feedbackRes, waitlistRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/feedback'),
        fetch('/api/waitlist'),
      ])
      
      const statsData = await statsRes.json()
      const feedbackData = await feedbackRes.json()
      const waitlistData = await waitlistRes.json()
      
      setStats({
        totalUsers: statsData.totalUsers || 0,
        newUsersThisMonth: statsData.newUsersThisMonth || 0,
        activeSubscriptions: statsData.activeSubscriptions || 0,
        feedbackCount: feedbackData.feedback?.length || 0,
        waitlistCount: waitlistData.entries?.length || 0,
        recentSignups: statsData.recentSignups || [],
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-[var(--section-spacing,1.5rem)]">
        <div className="animate-pulse space-y-[var(--content-density-gap,1rem)]">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--content-density-gap,1rem)]">
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-[var(--section-spacing,1.5rem)] space-y-[var(--content-density-gap,1rem)]">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Analytics
        </h1>
        <p className="text-muted-foreground">Overview of your SaaS metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[var(--content-density-gap,1rem)]">
        <DSCard>
          <DSCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <DSCardTitle className="text-sm font-medium">Total Users</DSCardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </DSCardHeader>
          <DSCardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              All registered accounts
            </p>
          </DSCardContent>
        </DSCard>

        <DSCard>
          <DSCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <DSCardTitle className="text-sm font-medium">New This Month</DSCardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </DSCardHeader>
          <DSCardContent>
            <div className="text-2xl font-bold">{stats?.newUsersThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              Signups this month
            </p>
          </DSCardContent>
        </DSCard>

        <DSCard>
          <DSCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <DSCardTitle className="text-sm font-medium">Subscriptions</DSCardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </DSCardHeader>
          <DSCardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active paid plans
            </p>
          </DSCardContent>
        </DSCard>

        <DSCard>
          <DSCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <DSCardTitle className="text-sm font-medium">Waitlist</DSCardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </DSCardHeader>
          <DSCardContent>
            <div className="text-2xl font-bold">{stats?.waitlistCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pre-launch signups
            </p>
          </DSCardContent>
        </DSCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--content-density-gap,1rem)]">
        <DSCard>
          <DSCardHeader>
            <DSCardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Signups
            </DSCardTitle>
            <DSCardDescription>Latest user registrations</DSCardDescription>
          </DSCardHeader>
          <DSCardContent>
            {stats?.recentSignups && stats.recentSignups.length > 0 ? (
              <div className="space-y-[var(--content-density-gap,1rem)]">
                {stats.recentSignups.slice(0, 5).map((signup, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{signup.email}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(signup.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-[var(--section-spacing,1.5rem)]">
                No signups yet
              </p>
            )}
          </DSCardContent>
        </DSCard>

        <DSCard>
          <DSCardHeader>
            <DSCardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback
            </DSCardTitle>
            <DSCardDescription>User feedback submissions</DSCardDescription>
          </DSCardHeader>
          <DSCardContent>
            <div className="text-center py-[var(--section-spacing,1.5rem)]">
              <div className="text-3xl font-bold mb-2">{stats?.feedbackCount || 0}</div>
              <p className="text-muted-foreground">Total submissions</p>
              <a 
                href="/admin/feedback" 
                className="text-primary-600 dark:text-primary-400 text-sm hover:underline mt-4 inline-block"
              >
                View all feedback
              </a>
            </div>
          </DSCardContent>
        </DSCard>
      </div>
    </div>
  )
}
