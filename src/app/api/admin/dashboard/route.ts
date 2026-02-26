import { NextResponse } from 'next/server'
import { verifyAdminAccess, isErrorResponse, safeTableError } from '@/lib/admin-auth'

export async function GET() {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth

    let allUsers: any[] = []
    try {
      let authPage = 1
      while (true) {
        const { data: authData } = await adminClient.auth.admin.listUsers({ page: authPage, perPage: 100 })
        if (!authData?.users || authData.users.length === 0) break
        allUsers = allUsers.concat(authData.users)
        if (authData.users.length < 100) break
        authPage++
      }
    } catch {}

    const userMap = new Map<string, { name: string; email: string }>()
    for (const u of allUsers) {
      userMap.set(u.id, {
        name: u.user_metadata?.display_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown',
        email: u.email || '',
      })
    }

    let mrr = 0
    let activeSubscribers = 0
    let churnRiskCount = 0
    let canceledLast30 = 0
    let activeLast30 = 0
    try {
      const { data: subs, error } = await adminClient.from('muse_product_subscriptions').select('*')
      if (!error && subs) {
        const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        for (const s of subs) {
          if (s.status === 'active' || s.status === 'trialing') {
            mrr += s.price_amount || 0
            activeSubscribers++
            activeLast30++
            if (s.cancel_at_period_end || (s.current_period_end && new Date(s.current_period_end) < sevenDays)) {
              churnRiskCount++
            }
          }
          if (s.status === 'canceled' && s.canceled_at && new Date(s.canceled_at) > thirtyDaysAgo) {
            canceledLast30++
          }
        }
      }
    } catch {}

    const churnRate = activeLast30 + canceledLast30 > 0
      ? Math.round((canceledLast30 / (activeLast30 + canceledLast30)) * 100)
      : 0

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const newUsersThisWeek = allUsers.filter(u =>
      u.created_at && new Date(u.created_at) > oneWeekAgo
    ).length

    let openTickets = 0
    try {
      const { data, error, count } = await adminClient.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'pending', 'in_progress'])
      if (!error) openTickets = count || 0
    } catch {}

    let failedPayments = 0
    try {
      const { data, error, count } = await adminClient.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'failed')
      if (!error) failedPayments = count || 0
    } catch {}

    const alerts: { id: string; title: string; count: number; href: string; severity: 'warning' | 'danger' | 'info' }[] = []

    try {
      const twentyFourHours = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const now = new Date()
      const { data, error, count } = await adminClient
        .from('muse_product_subscriptions')
        .select('id', { count: 'exact', head: true })
        .in('status', ['active', 'trialing'])
        .lte('current_period_end', twentyFourHours.toISOString())
        .gte('current_period_end', now.toISOString())
      if (!error && count && count > 0) {
        alerts.push({ id: 'renewals_24h', title: 'Subscriptions renewing in 24 hours', count, href: '/admin/subscriptions?sort=renewal', severity: 'info' })
      }
    } catch {}

    if (failedPayments > 0) {
      alerts.push({ id: 'failed_payments', title: 'Failed payments needing attention', count: failedPayments, href: '/admin/revenue?status=failed', severity: 'danger' })
    }

    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
      const { data, error, count } = await adminClient
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .in('status', ['open', 'pending'])
        .lt('created_at', fortyEightHoursAgo.toISOString())
      if (!error && count && count > 0) {
        alerts.push({ id: 'stale_tickets', title: 'Unresolved tickets older than 48 hours', count, href: '/admin/feedback', severity: 'warning' })
      }
    } catch {}

    try {
      const { data, error, count } = await adminClient
        .from('affiliate_payouts')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'processing'])
      if (!error && count && count > 0) {
        alerts.push({ id: 'pending_payouts', title: 'Pending affiliate payouts', count, href: '/admin/revenue?type=payout&status=pending', severity: 'warning' })
      }
    } catch {}

    try {
      const { data, error, count } = await adminClient
        .from('affiliate_applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (!error && count && count > 0) {
        alerts.push({ id: 'pending_applications', title: 'Pending affiliate applications', count, href: '/admin/affiliates', severity: 'info' })
      }
    } catch {}

    let recentActivity: any[] = []
    try {
      const { data, error } = await adminClient
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15)
      if (!error && data) {
        recentActivity = data.map(a => {
          const user = userMap.get(a.user_id)
          return {
            id: a.id,
            type: mapActivityType(a.action || a.type),
            title: formatActivityTitle(a, user),
            description: a.details || a.description || undefined,
            timestamp: a.created_at,
            href: getActivityHref(a),
          }
        })
      }
    } catch {}

    let revenueTrend: { date: string; amount: number }[] = []
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const { data, error } = await adminClient
        .from('invoices')
        .select('amount_paid_cents, created_at')
        .eq('status', 'paid')
        .gte('created_at', sevenDaysAgo.toISOString())

      if (!error && data) {
        const dailyMap = new Map<string, number>()
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          dailyMap.set(d.toISOString().split('T')[0], 0)
        }
        for (const inv of data) {
          const day = new Date(inv.created_at).toISOString().split('T')[0]
          dailyMap.set(day, (dailyMap.get(day) || 0) + (inv.amount_paid_cents || 0))
        }
        revenueTrend = Array.from(dailyMap.entries()).map(([date, amount]) => ({ date, amount }))
      }
    } catch {}

    return NextResponse.json({
      kpis: {
        mrr,
        activeSubscribers,
        newUsersThisWeek,
        openTickets,
        churnRate,
        failedPayments,
      },
      alerts,
      recentActivity,
      revenueTrend,
    })
  } catch (err) {
    console.error('Dashboard API error:', err)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}

function mapActivityType(action: string): string {
  if (!action) return 'other'
  const lower = action.toLowerCase()
  if (lower.includes('signup') || lower.includes('register')) return 'signup'
  if (lower.includes('payment') || lower.includes('charge')) return 'payment'
  if (lower.includes('login') || lower.includes('sign_in')) return 'login'
  if (lower.includes('ticket') || lower.includes('support')) return 'ticket'
  if (lower.includes('commission')) return 'commission'
  if (lower.includes('payout')) return 'payout'
  if (lower.includes('role')) return 'role_change'
  if (lower.includes('setting') || lower.includes('config')) return 'setting'
  if (lower.includes('invoice')) return 'invoice'
  return 'other'
}

function formatActivityTitle(activity: any, user?: { name: string; email: string }): string {
  const userName = user?.name || 'Unknown user'
  const action = activity.action || activity.type || 'Activity'
  return `${userName} — ${action.replace(/_/g, ' ')}`
}

function getActivityHref(activity: any): string | undefined {
  if (activity.user_id) return `/admin/crm/${activity.user_id}`
  return undefined
}
