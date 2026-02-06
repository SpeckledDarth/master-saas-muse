'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Users, DollarSign, CreditCard, UserPlus, MessageSquare, ListChecks } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MetricsData {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  activeSubscriptions: number
  mrr: number
  totalFeedback: number
  waitlistCount: number
  userGrowth: { date: string; count: number }[]
  revenueGrowth: { date: string; amount: number }[]
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await fetch('/api/admin/metrics')
        const data = await response.json()

        if (response.ok) {
          setMetrics(data)
        } else {
          setError(data.error || 'Failed to load metrics')
          toast({
            title: 'Failed to load metrics',
            description: data.error || 'Unknown error',
            variant: 'destructive',
          })
        }
      } catch {
        setError('Failed to load metrics')
        toast({
          title: 'Failed to load metrics',
          description: 'Please try again',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loader-metrics">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex items-center justify-center min-h-[200px]">
            <p className="text-muted-foreground" data-testid="text-metrics-error">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  function formatCurrency(cents: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-metrics-title">Metrics Dashboard</h1>
        <p className="text-muted-foreground" data-testid="text-metrics-description">Key performance indicators and growth trends</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">{metrics?.totalUsers ?? 0}</div>
            <p className="text-xs text-muted-foreground">+{metrics?.newUsersToday ?? 0} today</p>
          </CardContent>
        </Card>

        <Card data-testid="card-new-users-month">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-new-users-month">{metrics?.newUsersThisMonth ?? 0}</div>
            <p className="text-xs text-muted-foreground">+{metrics?.newUsersThisWeek ?? 0} this week</p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-subscriptions">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-subscriptions">{metrics?.activeSubscriptions ?? 0}</div>
            <p className="text-xs text-muted-foreground">Paid accounts</p>
          </CardContent>
        </Card>

        <Card data-testid="card-mrr">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-mrr">{formatCurrency(metrics?.mrr ?? 0)}</div>
            <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="col-span-full lg:col-span-1" data-testid="card-user-growth">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New users over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.userGrowth ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-1" data-testid="card-revenue-growth">
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
            <CardDescription>Revenue over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.revenueGrowth ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card data-testid="card-feedback-count">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-feedback-count">{metrics?.totalFeedback ?? 0}</div>
            <p className="text-xs text-muted-foreground">User submissions</p>
          </CardContent>
        </Card>

        <Card data-testid="card-waitlist-count">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waitlist</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-waitlist-count">{metrics?.waitlistCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">People waiting</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
