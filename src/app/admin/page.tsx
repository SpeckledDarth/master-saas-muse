'use client'

import { useEffect, useState, type ElementType } from 'react'
import Link from 'next/link'
import {
  DollarSign, Users, UserPlus, MessageSquare, TrendingDown, CreditCard,
  AlertTriangle, ArrowRight, Loader2, Activity, Send, Bell, ArrowDown,
  Calendar, Clock, BarChart3, Target, ThumbsUp, ListChecks,
} from 'lucide-react'
import { DSCard, DSCardHeader, DSCardContent, DSCardTitle, DSCardDescription } from '@/components/ui/ds-card'
import { DSGrid } from '@/components/ui/ds-grid'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Timeline, type TimelineEvent } from '@/components/admin/timeline'
import { useToast } from '@/hooks/use-toast'
import { useChartConfig } from '@/hooks/use-chart-config'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ThemedChartTooltip } from '@/components/ui/chart-tooltip'

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatWaterfallCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val / 100)
}

interface KPI {
  label: string
  value: string | number
  icon: ElementType
  href: string
  color: string
}

interface Alert {
  id: string
  title: string
  count: number
  href: string
  severity: 'warning' | 'danger' | 'info'
}

interface DashboardData {
  kpis: {
    mrr: number
    activeSubscribers: number
    newUsersThisWeek: number
    openTickets: number
    churnRate: number
    failedPayments: number
  }
  alerts: Alert[]
  recentActivity: TimelineEvent[]
  revenueTrend: { date: string; amount: number }[]
}

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
}

interface WaterfallData {
  label: string
  revenue: number
  commissions: number
  net: number
}

interface ScheduledReportConfig {
  weeklyReportEnabled: boolean
  monthlyReportEnabled: boolean
  lastWeeklyReport?: string
  lastMonthlyReport?: string
}

const SEVERITY_STYLES: Record<string, string> = {
  danger: 'border-destructive/30 bg-destructive/5 text-destructive',
  warning: 'border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5 text-[hsl(var(--warning))]',
  info: 'border-primary/30 bg-primary/5 text-primary',
}

function KPISkeleton() {
  return (
    <div className="grid gap-[var(--content-density-gap,1rem)] grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-[var(--card-radius,0.75rem)] border bg-card p-[var(--card-padding,1.25rem)] animate-pulse">
          <div className="h-3 bg-muted rounded w-2/3 mb-3" />
          <div className="h-7 bg-muted rounded w-1/2 mb-1" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}

function SparklineChart({ data }: { data: { date: string; amount: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-muted-foreground">No revenue data</div>
  }

  const maxVal = Math.max(...data.map(d => d.amount), 1)

  return (
    <div className="flex items-end gap-1 h-16" data-testid="chart-sparkline">
      {data.map((d, i) => {
        const heightPct = Math.max((d.amount / maxVal) * 100, 2)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm bg-primary/70 transition-all min-h-[2px]"
              style={{ height: `${heightPct}%` }}
              title={`${d.date}: ${formatCurrency(d.amount)}`}
            />
            <span className="text-[8px] text-muted-foreground">
              {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function npsColorClass(score: number) {
  if (score >= 50) return 'text-[hsl(var(--success))]'
  if (score >= 0) return 'text-[hsl(var(--warning))]'
  return 'text-[hsl(var(--danger))]'
}

function kpiWarningColor(condition: boolean) {
  return condition ? 'text-[hsl(var(--warning))]' : 'text-muted-foreground'
}

function kpiDangerColor(condition: boolean) {
  return condition ? 'text-destructive' : 'text-muted-foreground'
}

export default function AdminDashboard() {
  const [dashLoading, setDashLoading] = useState(true)
  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [waterfall, setWaterfall] = useState<WaterfallData[]>([])
  const [waterfallLoading, setWaterfallLoading] = useState(true)
  const [scheduledReports, setScheduledReports] = useState<ScheduledReportConfig>({ weeklyReportEnabled: false, monthlyReportEnabled: false })
  const [sendingReport, setSendingReport] = useState(false)
  const [checkingAlerts, setCheckingAlerts] = useState(false)
  const [triggeringCron, setTriggeringCron] = useState(false)
  const { toast } = useToast()
  const chartConfig = useChartConfig()

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard')
        if (res.ok) setDashData(await res.json())
      } catch {
      } finally {
        setDashLoading(false)
      }
    }

    async function fetchMetrics() {
      try {
        const res = await fetch('/api/admin/metrics')
        if (res.ok) setMetrics(await res.json())
      } catch {
      } finally {
        setMetricsLoading(false)
      }
    }

    async function fetchWaterfall() {
      try {
        const res = await fetch('/api/admin/revenue-waterfall')
        if (res.ok) {
          const data = await res.json()
          setWaterfall(Array.isArray(data.waterfall?.months) ? data.waterfall.months : [])
        }
      } catch {
      } finally {
        setWaterfallLoading(false)
      }
    }

    async function fetchScheduledReports() {
      try {
        const res = await fetch('/api/admin/setup')
        if (res.ok) {
          const data = await res.json()
          const sec = data.settings?.security || {}
          setScheduledReports({
            weeklyReportEnabled: sec.weeklyReportEnabled ?? false,
            monthlyReportEnabled: sec.monthlyReportEnabled ?? false,
            lastWeeklyReport: sec.lastWeeklyReport,
            lastMonthlyReport: sec.lastMonthlyReport,
          })
        }
      } catch {
      }
    }

    fetchDashboard()
    fetchMetrics()
    fetchWaterfall()
    fetchScheduledReports()
  }, [])

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
      const res = await fetch('/api/admin/metrics/alerts', { method: 'POST' })
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

  async function handleTriggerCron() {
    setTriggeringCron(true)
    try {
      const res = await fetch('/api/cron/scheduled-reports', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Scheduled reports triggered', description: data.message || 'Reports have been sent.' })
      } else {
        toast({ title: 'Failed', description: data.error || 'Could not trigger reports', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to trigger reports', variant: 'destructive' })
    } finally {
      setTriggeringCron(false)
    }
  }

  const isInitialLoad = dashLoading && metricsLoading

  if (isInitialLoad) {
    return (
      <div className="p-[var(--section-spacing,1.5rem)] space-y-[var(--content-density-gap,1rem)]" data-testid="page-dashboard">
        <div className="flex flex-wrap items-center justify-between gap-[var(--content-density-gap,1rem)]">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-admin-title">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Your command center</p>
          </div>
        </div>
        <KPISkeleton />
        <DSGrid cols={{ default: 1, lg: 3 }}>
          <div className="lg:col-span-2 rounded-[var(--card-radius,0.75rem)] border bg-card p-[var(--card-padding,1.25rem)] animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[var(--card-radius,0.75rem)] border bg-card p-[var(--card-padding,1.25rem)] animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-4" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </DSGrid>
      </div>
    )
  }

  const kpis = dashData?.kpis
  const alerts = dashData?.alerts ?? []
  const recentActivity = dashData?.recentActivity ?? []
  const revenueTrend = dashData?.revenueTrend ?? []

  const kpiCards: KPI[] = kpis ? [
    { label: 'MRR', value: formatCurrency(kpis.mrr), icon: DollarSign, href: '/admin/revenue?type=invoice&status=paid', color: 'text-[hsl(var(--success))]' },
    { label: 'Active Subscribers', value: kpis.activeSubscribers, icon: CreditCard, href: '/admin/subscriptions?status=active', color: 'text-primary' },
    { label: 'New Users (7d)', value: kpis.newUsersThisWeek, icon: UserPlus, href: '/admin/crm?sort=newest', color: 'text-primary' },
    { label: 'Open Tickets', value: kpis.openTickets, icon: MessageSquare, href: '/admin/feedback', color: kpiWarningColor(kpis.openTickets > 0) },
    { label: 'Churn Rate', value: `${kpis.churnRate}%`, icon: TrendingDown, href: '/admin/subscriptions?churnRisk=true', color: kpiDangerColor(kpis.churnRate > 5) },
    { label: 'Failed Payments', value: kpis.failedPayments, icon: AlertTriangle, href: '/admin/revenue?status=failed', color: kpiDangerColor(kpis.failedPayments > 0) },
  ] : []

  return (
    <div className="p-[var(--section-spacing,1.5rem)] space-y-[var(--content-density-gap,1rem)]" data-testid="page-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-[var(--content-density-gap,1rem)]">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-admin-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your command center</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSendReport} disabled={sendingReport} data-testid="button-send-report">
            {sendingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-1">Email Report</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleCheckAlerts} disabled={checkingAlerts} data-testid="button-check-alerts">
            {checkingAlerts ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            <span className="ml-1">Check Alerts</span>
          </Button>
        </div>
      </div>

      {kpiCards.length > 0 && (
        <div className="grid gap-[var(--content-density-gap,1rem)] grid-cols-2 md:grid-cols-3 lg:grid-cols-6" data-testid="section-kpi-grid">
          {kpiCards.map(kpi => {
            const Icon = kpi.icon
            return (
              <Link
                key={kpi.label}
                href={kpi.href}
                className="rounded-[var(--card-radius,0.75rem)] border-[length:var(--card-border-width,1px)] border-[var(--card-border-style,solid)] border-border bg-card p-[var(--card-padding,1.25rem)] shadow-[var(--card-shadow,0_1px_2px_0_rgb(0_0_0/0.05))] hover:bg-muted/30 transition-colors group"
                data-testid={`card-kpi-${kpi.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className="text-xl font-bold tabular-nums">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>View</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {!metricsLoading && metrics && (
        <DSGrid cols={{ default: 2, md: 4 }} data-testid="section-secondary-kpis">
          <DSCard data-testid="card-arpu">
            <DSCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <DSCardTitle className="text-sm font-medium">ARPU</DSCardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </DSCardHeader>
            <DSCardContent>
              <div className="text-2xl font-bold" data-testid="text-arpu">{formatCurrency(metrics.arpu ?? 0)}</div>
              <p className="text-xs text-muted-foreground">Per user per month</p>
            </DSCardContent>
          </DSCard>
          <DSCard data-testid="card-ltv">
            <DSCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <DSCardTitle className="text-sm font-medium">LTV</DSCardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </DSCardHeader>
            <DSCardContent>
              <div className="text-2xl font-bold" data-testid="text-ltv">{formatCurrency(metrics.ltv ?? 0)}</div>
              <p className="text-xs text-muted-foreground">Estimated lifetime value</p>
            </DSCardContent>
          </DSCard>
          <DSCard data-testid="card-conversion-rate">
            <DSCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <DSCardTitle className="text-sm font-medium">Conversion Rate</DSCardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </DSCardHeader>
            <DSCardContent>
              <div className="text-2xl font-bold" data-testid="text-conversion-rate">{(metrics.conversionRate ?? 0).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Free to paid</p>
            </DSCardContent>
          </DSCard>
          <DSCard data-testid="card-nps-score">
            <DSCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <DSCardTitle className="text-sm font-medium">NPS Score</DSCardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </DSCardHeader>
            <DSCardContent>
              <div className={`text-2xl font-bold ${npsColorClass(metrics.npsScore ?? 0)}`} data-testid="text-nps-score">{metrics.npsScore ?? 0}</div>
              <p className="text-xs text-muted-foreground">Based on {metrics.npsResponses ?? 0} responses</p>
            </DSCardContent>
          </DSCard>
        </DSGrid>
      )}

      {alerts.length > 0 && (
        <DSGrid cols={{ default: 1, md: 2, lg: 3 }} data-testid="section-alerts">
          {alerts.map(alert => (
            <Link
              key={alert.id}
              href={alert.href}
              className={`rounded-[var(--card-radius,0.75rem)] border p-[var(--card-padding,1.25rem)] flex items-center gap-3 hover:opacity-80 transition-opacity ${SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info}`}
              data-testid={`alert-${alert.id}`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{alert.title}</p>
              </div>
              <span className="text-lg font-bold tabular-nums">{alert.count}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          ))}
        </DSGrid>
      )}

      <DSGrid cols={{ default: 1, lg: 2 }}>
        <DSCard className="col-span-full lg:col-span-1" data-testid="card-user-growth">
          <DSCardHeader>
            <DSCardTitle>User Growth</DSCardTitle>
            <DSCardDescription>New users over the last 30 days</DSCardDescription>
          </DSCardHeader>
          <DSCardContent>
            {metricsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.userGrowth ?? []}>
                    {chartConfig.showGrid && <CartesianGrid strokeDasharray={chartConfig.gridDasharray} className="stroke-muted" />}
                    <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                    <Tooltip content={<ThemedChartTooltip valueLabel="users" />} cursor={false} />
                    <Line type={chartConfig.lineCurve} dataKey="count" stroke={chartConfig.colors[0]} strokeWidth={chartConfig.lineWidth} dot={chartConfig.showDots} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </DSCardContent>
        </DSCard>

        <DSCard className="col-span-full lg:col-span-1" data-testid="card-revenue-growth">
          <DSCardHeader>
            <DSCardTitle>Revenue Growth</DSCardTitle>
            <DSCardDescription>Revenue over the last 30 days</DSCardDescription>
          </DSCardHeader>
          <DSCardContent>
            {metricsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.revenueGrowth ?? []}>
                    {chartConfig.showGrid && <CartesianGrid strokeDasharray={chartConfig.gridDasharray} className="stroke-muted" />}
                    <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                    <Tooltip content={<ThemedChartTooltip valueLabel="revenue" valueFormatter={(v) => `$${v.toLocaleString()}`} />} cursor={false} />
                    <Line type={chartConfig.lineCurve} dataKey="amount" stroke={chartConfig.colors[1]} strokeWidth={chartConfig.lineWidth} dot={chartConfig.showDots} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </DSCardContent>
        </DSCard>
      </DSGrid>

      <DSGrid cols={{ default: 1, lg: 3 }}>
        <div className="lg:col-span-2 rounded-[var(--card-radius,0.75rem)] border bg-card p-[var(--card-padding,1.25rem)]" data-testid="section-activity">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </h2>
            <Link href="/admin/audit-logs" className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="link-view-all-activity">
              View All
            </Link>
          </div>
          {dashLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Timeline
              events={recentActivity}
              maxItems={15}
              compact
              emptyMessage="No recent activity"
            />
          )}
        </div>

        <div className="space-y-[var(--content-density-gap,1rem)]">
          <div className="rounded-[var(--card-radius,0.75rem)] border bg-card p-[var(--card-padding,1.25rem)]" data-testid="section-revenue-trend">
            <h2 className="text-sm font-medium mb-4">Revenue (7 days)</h2>
            <SparklineChart data={revenueTrend} />
            {revenueTrend.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">7-day total</span>
                  <span className="font-medium">{formatCurrency(revenueTrend.reduce((s, d) => s + d.amount, 0))}</span>
                </div>
              </div>
            )}
          </div>

          {!metricsLoading && metrics && (
            <DSGrid cols={{ default: 2 }}>
              <div className="rounded-[var(--card-radius,0.75rem)] border bg-card p-[var(--card-padding,1.25rem)]" data-testid="card-feedback-count">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Feedback</span>
                </div>
                <p className="text-xl font-bold" data-testid="text-feedback-count">{metrics.totalFeedback ?? 0}</p>
              </div>
              <div className="rounded-[var(--card-radius,0.75rem)] border bg-card p-[var(--card-padding,1.25rem)]" data-testid="card-waitlist-count">
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Waitlist</span>
                </div>
                <p className="text-xl font-bold" data-testid="text-waitlist-count">{metrics.waitlistCount ?? 0}</p>
              </div>
            </DSGrid>
          )}
        </div>
      </DSGrid>

      <DSCard data-testid="card-revenue-waterfall">
        <DSCardHeader>
          <div className="flex items-center gap-2">
            <ArrowDown className="h-5 w-5" />
            <div>
              <DSCardTitle>Revenue Waterfall</DSCardTitle>
              <DSCardDescription>Monthly MRR movement breakdown</DSCardDescription>
            </div>
          </div>
        </DSCardHeader>
        <DSCardContent>
          {waterfallLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : waterfall.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-waterfall-empty">No revenue waterfall data available yet</p>
          ) : (
            <>
              <div className="h-[350px]" data-testid="chart-revenue-waterfall">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfall} barSize={chartConfig.barSize}>
                    {chartConfig.showGrid && <CartesianGrid strokeDasharray={chartConfig.gridDasharray} className="stroke-muted" />}
                    <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 12 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 100).toLocaleString()}`} />
                    <Tooltip content={<ThemedChartTooltip valueFormatter={(v) => formatWaterfallCurrency(v)} />} cursor={false} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill={chartConfig.colors[0]} radius={[chartConfig.barRadius, chartConfig.barRadius, 0, 0]} />
                    <Bar dataKey="commissions" name="Commissions" fill="hsl(var(--warning))" radius={[chartConfig.barRadius, chartConfig.barRadius, 0, 0]} />
                    <Bar dataKey="net" name="Net" fill="hsl(var(--success))" radius={[chartConfig.barRadius, chartConfig.barRadius, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 font-medium">Month</th>
                      <th className="text-right py-2 font-medium">Revenue</th>
                      <th className="text-right py-2 font-medium">Commissions</th>
                      <th className="text-right py-2 font-medium">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waterfall.map((row) => (
                      <tr key={row.label} className="border-b" data-testid={`row-waterfall-${row.label}`}>
                        <td className="py-2">{row.label}</td>
                        <td className="text-right py-2">{formatWaterfallCurrency(row.revenue)}</td>
                        <td className="text-right py-2 text-[hsl(var(--warning))]">-{formatWaterfallCurrency(row.commissions)}</td>
                        <td className="text-right py-2 font-medium">{formatWaterfallCurrency(row.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </DSCardContent>
      </DSCard>

      <DSCard data-testid="card-scheduled-reports">
        <DSCardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <div>
              <DSCardTitle>Scheduled Reports</DSCardTitle>
              <DSCardDescription>Automated report delivery via cron jobs</DSCardDescription>
            </div>
          </div>
        </DSCardHeader>
        <DSCardContent className="space-y-[var(--content-density-gap,1rem)]">
          <DSGrid cols={{ default: 1, sm: 2 }}>
            <div className="flex items-start gap-3 p-[var(--card-padding,1.25rem)] border rounded-[var(--card-radius,0.75rem)]">
              <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Weekly Report</p>
                <p className="text-xs text-muted-foreground">Sent every Monday at 9:00 AM UTC</p>
                <Badge variant={scheduledReports.weeklyReportEnabled ? 'default' : 'secondary'} className="mt-1" data-testid="badge-weekly-report-status">
                  {scheduledReports.weeklyReportEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                {scheduledReports.lastWeeklyReport && (
                  <p className="text-xs text-muted-foreground mt-1" data-testid="text-last-weekly">Last sent: {new Date(scheduledReports.lastWeeklyReport).toLocaleDateString()}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3 p-[var(--card-padding,1.25rem)] border rounded-[var(--card-radius,0.75rem)]">
              <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Monthly Report</p>
                <p className="text-xs text-muted-foreground">Sent on the 1st of each month at 9:00 AM UTC</p>
                <Badge variant={scheduledReports.monthlyReportEnabled ? 'default' : 'secondary'} className="mt-1" data-testid="badge-monthly-report-status">
                  {scheduledReports.monthlyReportEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                {scheduledReports.lastMonthlyReport && (
                  <p className="text-xs text-muted-foreground mt-1" data-testid="text-last-monthly">Last sent: {new Date(scheduledReports.lastMonthlyReport).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </DSGrid>
          <Button variant="outline" size="sm" onClick={handleTriggerCron} disabled={triggeringCron} data-testid="button-trigger-cron">
            {triggeringCron ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
            Run Scheduled Reports Now
          </Button>
        </DSCardContent>
      </DSCard>
    </div>
  )
}
