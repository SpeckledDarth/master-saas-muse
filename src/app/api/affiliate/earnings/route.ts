import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: commissions, error } = await admin
      .from('affiliate_commissions')
      .select('commission_amount_cents, status, created_at')
      .eq('affiliate_user_id', user.id)

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ today: 0, thisWeek: 0, thisMonth: 0, allTime: 0 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let today = 0, thisWeek = 0, thisMonth = 0, allTime = 0

    for (const c of commissions || []) {
      const amount = c.commission_amount_cents || 0
      const created = new Date(c.created_at)

      allTime += amount
      if (created >= monthStart) thisMonth += amount
      if (created >= weekStart) thisWeek += amount
      if (created >= todayStart) today += amount
    }

    return NextResponse.json({ today, thisWeek, thisMonth, allTime })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ today: 0, thisWeek: 0, thisMonth: 0, allTime: 0 })
    }
    console.error('Earnings GET error:', err)
    return NextResponse.json({ error: 'Failed to load earnings' }, { status: 500 })
  }
}
