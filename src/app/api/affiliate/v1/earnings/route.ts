import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateApiKey } from '@/lib/affiliate/api-auth'

export async function GET(request: NextRequest) {
  const result = await validateApiKey(request)
  if (!result.success) return result.response

  const { auth, headers } = result

  try {
    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'

    const { data: commissions, error } = await admin
      .from('affiliate_commissions')
      .select('commission_amount_cents, status, created_at')
      .eq('affiliate_user_id', auth.affiliateUserId)

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ today: 0, this_week: 0, this_month: 0, all_time: 0, by_status: {} }, { headers })
      }
      return NextResponse.json({ error: error.message }, { status: 500, headers })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let today = 0, thisWeek = 0, thisMonth = 0, allTime = 0
    const byStatus: Record<string, number> = {}

    for (const c of commissions || []) {
      const amount = c.commission_amount_cents || 0
      const created = new Date(c.created_at)
      const status = c.status || 'unknown'

      allTime += amount
      byStatus[status] = (byStatus[status] || 0) + amount
      if (created >= monthStart) thisMonth += amount
      if (created >= weekStart) thisWeek += amount
      if (created >= todayStart) today += amount
    }

    return NextResponse.json({
      today,
      this_week: thisWeek,
      this_month: thisMonth,
      all_time: allTime,
      by_status: byStatus,
    }, { headers })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ today: 0, this_week: 0, this_month: 0, all_time: 0, by_status: {} }, { headers })
    }
    console.error('v1/earnings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
