'use client'

import { useEffect, useState, type ElementType } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DollarSign, Users, UserPlus, MessageSquare, TrendingDown, CreditCard,
  AlertTriangle, ArrowRight, Loader2, Activity,
} from 'lucide-react'
import { Timeline, type TimelineEvent } from '@/components/admin/timeline'

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
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

const SEVERITY_STYLES: Record<string, string> = {
  danger: 'border-destructive/30 bg-destructive/5 text-destructive',
  warning: 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400',
  info: 'border-primary/30 bg-primary/5 text-primary',
}

function KPISkeleton() {
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
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
  const barWidth = 100 / data.length

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

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard')
        if (res.ok) {
          setData(await res.json())
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading || !data) {
    return (
      <div className="p-6" data-testid="page-dashboard">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-admin-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your command center</p>
        </div>
        <KPISkeleton />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border bg-card p-4 animate-pulse">
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
          <div className="rounded-lg border bg-card p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-4" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  const { kpis, alerts, recentActivity, revenueTrend } = data

  const kpiCards: KPI[] = [
    { label: 'MRR', value: formatCurrency(kpis.mrr), icon: DollarSign, href: '/admin/revenue?type=invoice&status=paid', color: 'text-green-600 dark:text-green-400' },
    { label: 'Active Subscribers', value: kpis.activeSubscribers, icon: CreditCard, href: '/admin/subscriptions?status=active', color: 'text-primary' },
    { label: 'New Users (7d)', value: kpis.newUsersThisWeek, icon: UserPlus, href: '/admin/crm?sort=newest', color: 'text-primary' },
    { label: 'Open Tickets', value: kpis.openTickets, icon: MessageSquare, href: '/admin/feedback', color: kpis.openTickets > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground' },
    { label: 'Churn Rate', value: `${kpis.churnRate}%`, icon: TrendingDown, href: '/admin/subscriptions?churnRisk=true', color: kpis.churnRate > 5 ? 'text-destructive' : 'text-muted-foreground' },
    { label: 'Failed Payments', value: kpis.failedPayments, icon: AlertTriangle, href: '/admin/revenue?status=failed', color: kpis.failedPayments > 0 ? 'text-destructive' : 'text-muted-foreground' },
  ]

  return (
    <div className="p-6" data-testid="page-dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-admin-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your command center</p>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
        {kpiCards.map(kpi => {
          const Icon = kpi.icon
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors group"
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

      {alerts.length > 0 && (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6" data-testid="section-alerts">
          {alerts.map(alert => (
            <Link
              key={alert.id}
              href={alert.href}
              className={`rounded-lg border p-3 flex items-center gap-3 hover:opacity-80 transition-opacity ${SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info}`}
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
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border bg-card p-4" data-testid="section-activity">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </h2>
            <Link href="/admin/audit-logs" className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="link-view-all-activity">
              View All
            </Link>
          </div>
          <Timeline
            events={recentActivity}
            maxItems={15}
            compact
            emptyMessage="No recent activity"
          />
        </div>

        <div className="rounded-lg border bg-card p-4" data-testid="section-revenue-trend">
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
      </div>
    </div>
  )
}
