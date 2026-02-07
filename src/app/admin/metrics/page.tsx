'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Users, DollarSign, CreditCard, UserPlus, MessageSquare, ListChecks, TrendingDown, Target, ThumbsUp, BarChart3, Send, Bell, Share2 } from 'lucide-react'
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
  arpu: number
  ltv: number
  churnRate: number
  conversionRate: number
  npsScore: number
  npsResponses: number
  cancelledThisMonth: number
  churnTrend: { date: string; count: number }[]
  alertThresholds?: {
    alertChurnThreshold?: number
    alertMinMonthlyUsers?: number
  }
  socialMetrics?: {
    socialModuleEnabled: boolean
    totalPosts: number
    postsThisMonth: number
    scheduledPosts: number
    connectedAccounts: number
  }
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingReport, setSendingReport] = useState(false)
  const [checkingAlerts, setCheckingAlerts] = useState(false)
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

  async function handleSendReport() {
    setSendingReport(true)
    try {
      const res = await fetch('/api/admin/metrics/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: 'weekly' }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Report sent', description: data.message || 'Check your email' })
      } else {
        toast({ title: 'Failed to send report', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send report', variant: 'destructive' })
    } finally {
      setSendingReport(false)
    }
  }

  async function handleCheckAlerts() {
    setCheckingAlerts(true)
    try {
      const res = await fetch('/api/admin/metrics/alerts', {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        const count = data.triggered?.length || 0
        toast({
          title: count > 0 ? `${count} alert(s) triggered` : 'No alerts triggered',
          description: count > 0 ? `Alerts: ${data.triggered.join(', ')}` : data.message || 'All metrics within thresholds',
        })
      } else {
        toast({ title: 'Alert check failed', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to check alerts', variant: 'destructive' })
    } finally {
      setCheckingAlerts(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-metrics-title">Metrics Dashboard</h1>
          <p className="text-muted-foreground" data-testid="text-metrics-description">Key performance indicators and growth trends</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendReport}
            disabled={sendingReport}
            data-testid="button-send-report"
          >
            {sendingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-1">Email Report</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckAlerts}
            disabled={checkingAlerts}
            data-testid="button-check-alerts"
          >
            {checkingAlerts ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            <span className="ml-1">Check Alerts</span>
          </Button>
        </div>
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
            {typeof metrics?.alertThresholds?.alertMinMonthlyUsers === 'number' && (
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-min-users-threshold">
                Alert if below: {metrics.alertThresholds.alertMinMonthlyUsers}
              </p>
            )}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-arpu">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-arpu">{formatCurrency(metrics?.arpu ?? 0)}</div>
            <p className="text-xs text-muted-foreground">Per user per month</p>
          </CardContent>
        </Card>

        <Card data-testid="card-ltv">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ltv">{formatCurrency(metrics?.ltv ?? 0)}</div>
            <p className="text-xs text-muted-foreground">Estimated lifetime value</p>
          </CardContent>
        </Card>

        <Card data-testid="card-churn-rate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-churn-rate">{(metrics?.churnRate ?? 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{metrics?.cancelledThisMonth ?? 0} cancelled this month</p>
            {typeof metrics?.alertThresholds?.alertChurnThreshold === 'number' && (
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-churn-threshold">
                Alert threshold: {metrics.alertThresholds.alertChurnThreshold}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversion-rate">{(metrics?.conversionRate ?? 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Free to paid</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card data-testid="card-nps-score">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(metrics?.npsScore ?? 0) >= 50 ? 'text-green-600' : (metrics?.npsScore ?? 0) >= 0 ? 'text-yellow-600' : 'text-red-600'}`} data-testid="text-nps-score">{metrics?.npsScore ?? 0}</div>
            <p className="text-xs text-muted-foreground">Based on {metrics?.npsResponses ?? 0} responses</p>
          </CardContent>
        </Card>
      </div>
      {metrics?.socialMetrics?.socialModuleEnabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-social-total-posts">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Social Posts</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-social-total-posts">{metrics.socialMetrics.totalPosts}</div>
              <p className="text-xs text-muted-foreground">Total generated</p>
            </CardContent>
          </Card>

          <Card data-testid="card-social-posts-month">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posts This Month</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-social-posts-month">{metrics.socialMetrics.postsThisMonth}</div>
              <p className="text-xs text-muted-foreground">Created this month</p>
            </CardContent>
          </Card>

          <Card data-testid="card-social-scheduled">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-social-scheduled">{metrics.socialMetrics.scheduledPosts}</div>
              <p className="text-xs text-muted-foreground">Pending posts</p>
            </CardContent>
          </Card>

          <Card data-testid="card-social-accounts">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-social-accounts">{metrics.socialMetrics.connectedAccounts}</div>
              <p className="text-xs text-muted-foreground">Active connections</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
