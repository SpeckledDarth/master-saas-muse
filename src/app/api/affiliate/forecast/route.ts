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

    let isAffiliate = false
    try {
      const { data: link } = await adminClient
        .from('referral_links')
        .select('is_affiliate')
        .eq('user_id', user.id)
        .maybeSingle()

      isAffiliate = !!link?.is_affiliate
    } catch (e: any) {
      if (e?.code === '42P01') return NextResponse.json({ error: 'Not available' }, { status: 404 })
      throw e
    }

    if (!isAffiliate) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    const now = new Date()
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

    let recentCommissions: any[] = []
    let monthCommissions: any[] = []
    let lastMonthTotal = 0

    try {
      const { data: recent } = await adminClient
        .from('affiliate_commissions')
        .select('commission_amount_cents, created_at')
        .eq('affiliate_user_id', user.id)
        .gte('created_at', fourteenDaysAgo)

      recentCommissions = recent || []
    } catch (e: any) {
      if (e?.code !== '42P01') throw e
    }

    try {
      const { data: monthData } = await adminClient
        .from('affiliate_commissions')
        .select('commission_amount_cents')
        .eq('affiliate_user_id', user.id)
        .gte('created_at', firstOfMonth)

      monthCommissions = monthData || []
    } catch (e: any) {
      if (e?.code !== '42P01') throw e
    }

    try {
      const { data: lastMonthData } = await adminClient
        .from('affiliate_commissions')
        .select('commission_amount_cents')
        .eq('affiliate_user_id', user.id)
        .gte('created_at', lastMonth.toISOString())
        .lte('created_at', endOfLastMonth)

      lastMonthTotal = lastMonthData?.reduce((s, c) => s + c.commission_amount_cents, 0) || 0
    } catch (e: any) {
      if (e?.code !== '42P01') throw e
    }

    const monthSoFar = monthCommissions.reduce((s, c) => s + c.commission_amount_cents, 0)

    const dailyTotals: Record<string, number> = {}
    recentCommissions.forEach(c => {
      const day = new Date(c.created_at).toISOString().split('T')[0]
      dailyTotals[day] = (dailyTotals[day] || 0) + c.commission_amount_cents
    })

    const dayValues = Object.values(dailyTotals)
    const activeDays = dayValues.length
    const dailyAvg = activeDays > 0
      ? dayValues.reduce((s, v) => s + v, 0) / 14
      : 0

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth = now.getDate()
    const daysRemaining = daysInMonth - dayOfMonth

    const projectedTotal = Math.round(monthSoFar + (dailyAvg * daysRemaining))

    let variance = 0
    if (activeDays > 1) {
      const mean = dayValues.reduce((s, v) => s + v, 0) / activeDays
      variance = Math.sqrt(
        dayValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / activeDays
      )
    }

    const optimistic = Math.round(projectedTotal + variance * Math.sqrt(daysRemaining) * 0.5)
    const pessimistic = Math.max(0, Math.round(projectedTotal - variance * Math.sqrt(daysRemaining) * 0.5))

    const paceVsLastMonth = lastMonthTotal > 0
      ? Math.round(((projectedTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : null

    let tierInfo: any = null
    try {
      const { data: tiers } = await adminClient
        .from('affiliate_tiers')
        .select('*')
        .order('min_referrals', { ascending: true })

      const { data: referrals } = await adminClient
        .from('affiliate_referrals')
        .select('id')
        .eq('affiliate_user_id', user.id)

      const refCount = referrals?.length || 0

      if (tiers && tiers.length > 0) {
        const currentTier = [...tiers].reverse().find(t => refCount >= t.min_referrals)
        const nextTier = tiers.find(t => t.min_referrals > refCount)

        if (nextTier) {
          const remaining = nextTier.min_referrals - refCount
          tierInfo = {
            currentTierName: currentTier?.name || 'Starter',
            nextTierName: nextTier.name,
            nextTierRate: nextTier.commission_rate,
            referralsNeeded: remaining,
          }
        }
      }
    } catch {}

    return NextResponse.json({
      monthSoFar,
      projectedTotal,
      optimistic,
      pessimistic,
      dailyAvg: Math.round(dailyAvg),
      paceVsLastMonth,
      daysRemaining,
      tierInfo,
    })
  } catch (error) {
    console.error('Forecast error:', error)
    return NextResponse.json({ error: 'Failed to load forecast' }, { status: 500 })
  }
}
