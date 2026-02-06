import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: teamMember } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', 1)
      .maybeSingle()

    const isAdmin = userRole?.role === 'admin'
    const canView = isAdmin || teamMember?.role === 'owner' || teamMember?.role === 'manager'

    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    let totalUsers = 0
    let newUsersToday = 0
    let newUsersThisWeek = 0
    let newUsersThisMonth = 0
    let activeSubscriptions = 0
    let mrr = 0
    let totalFeedback = 0
    let waitlistCount = 0
    const userGrowth: { date: string; count: number }[] = []
    const revenueGrowth: { date: string; amount: number }[] = []

    try {
      let allUsers: { id: string; created_at: string }[] = []
      let page = 1
      const perPage = 100

      while (true) {
        const { data: authData } = await adminClient.auth.admin.listUsers({ page, perPage })
        if (!authData?.users || authData.users.length === 0) break
        allUsers = allUsers.concat(authData.users.map(u => ({ id: u.id, created_at: u.created_at })))
        if (authData.users.length < perPage) break
        page++
      }

      totalUsers = allUsers.length

      for (const u of allUsers) {
        if (u.created_at >= todayStart) newUsersToday++
        if (u.created_at >= weekAgo) newUsersThisWeek++
        if (u.created_at >= monthAgo) newUsersThisMonth++
      }

      const growthMap = new Map<string, number>()
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const key = d.toISOString().split('T')[0]
        growthMap.set(key, 0)
      }
      for (const u of allUsers) {
        const dateKey = u.created_at.split('T')[0]
        if (growthMap.has(dateKey)) {
          growthMap.set(dateKey, (growthMap.get(dateKey) || 0) + 1)
        }
      }
      for (const [date, count] of growthMap) {
        userGrowth.push({ date, count })
      }
    } catch (err) {
      console.error('Error fetching user metrics:', err)
    }

    try {
      const { data: subs, error } = await adminClient
        .from('subscriptions')
        .select('id, status, price_amount, current_period_start, current_period_end')
        .in('status', ['active', 'trialing'])

      if (!error && subs) {
        activeSubscriptions = subs.length
        mrr = subs.reduce((sum, s) => sum + (s.price_amount || 0), 0)
      }
    } catch {
      activeSubscriptions = 0
      mrr = 0
    }

    try {
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, stripe_subscription_id')
        .not('stripe_subscription_id', 'is', null)

      if (profiles && activeSubscriptions === 0) {
        activeSubscriptions = profiles.length
      }
    } catch {}

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      revenueGrowth.push({ date: key, amount: 0 })
    }

    try {
      const { count, error } = await adminClient
        .from('feedback')
        .select('*', { count: 'exact', head: true })

      if (!error && count !== null) {
        totalFeedback = count
      }
    } catch {
      totalFeedback = 0
    }

    try {
      const { count, error } = await adminClient
        .from('waitlist')
        .select('*', { count: 'exact', head: true })

      if (!error && count !== null) {
        waitlistCount = count
      }
    } catch {
      waitlistCount = 0
    }

    let cancelledThisMonth = 0
    const churnTrend: { date: string; count: number }[] = []

    try {
      const { data: cancelledSubs } = await adminClient
        .from('subscriptions')
        .select('id, status, current_period_end, canceled_at')
        .eq('status', 'canceled')
        .gte('current_period_end', monthAgo)

      if (cancelledSubs) {
        cancelledThisMonth = cancelledSubs.length

        const churnMap = new Map<string, number>()
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const key = d.toISOString().split('T')[0]
          churnMap.set(key, 0)
        }
        for (const s of cancelledSubs) {
          const dateKey = (s.canceled_at || s.current_period_end || '').split('T')[0]
          if (churnMap.has(dateKey)) {
            churnMap.set(dateKey, (churnMap.get(dateKey) || 0) + 1)
          }
        }
        for (const [date, count] of churnMap) {
          churnTrend.push({ date, count })
        }
      }
    } catch {
      cancelledThisMonth = 0
    }

    if (churnTrend.length === 0) {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const key = d.toISOString().split('T')[0]
        churnTrend.push({ date: key, count: 0 })
      }
    }

    const arpu = totalUsers > 0 ? Math.round(mrr / totalUsers) : 0
    const churnRate = (activeSubscriptions + cancelledThisMonth) > 0
      ? (cancelledThisMonth / (activeSubscriptions + cancelledThisMonth)) * 100
      : 0
    const ltv = churnRate > 0 ? Math.round(arpu / (churnRate / 100)) : arpu * 24
    const conversionRate = totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0

    let npsScore = 0
    let npsResponses = 0

    try {
      const { data: npsData } = await adminClient
        .from('feedback')
        .select('nps_score')
        .not('nps_score', 'is', null)

      if (npsData && npsData.length > 0) {
        npsResponses = npsData.length
        let promoters = 0
        let detractors = 0
        for (const row of npsData) {
          const score = row.nps_score as number
          if (score >= 9) promoters++
          else if (score <= 6) detractors++
        }
        npsScore = Math.round(((promoters - detractors) / npsResponses) * 100)
      }
    } catch {
      npsScore = 0
      npsResponses = 0
    }

    return NextResponse.json({
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeSubscriptions,
      mrr,
      totalFeedback,
      waitlistCount,
      userGrowth,
      revenueGrowth,
      arpu,
      ltv,
      churnRate,
      conversionRate,
      npsScore,
      npsResponses,
      cancelledThisMonth,
      churnTrend,
    })
  } catch (error) {
    console.error('Admin metrics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
