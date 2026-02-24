import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const admin = createAdminClient()
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'all'
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = admin
      .from('affiliate_transactions')
      .select('*', { count: 'exact' })
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type !== 'all') {
      query = query.eq('type', type)
    }

    const { data: transactions, count, error } = await query

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ transactions: [], total: 0, summary: { total_earned: 0, total_paid: 0, balance: 0 } })
      }
      throw error
    }

    const { data: summaryData } = await admin
      .from('affiliate_transactions')
      .select('type, amount_cents')
      .eq('affiliate_user_id', user.id)

    let totalEarned = 0
    let totalPaid = 0
    let totalAdjustments = 0

    ;(summaryData || []).forEach(t => {
      if (t.type === 'commission_earned' || t.type === 'bonus_awarded') {
        totalEarned += t.amount_cents
      } else if (t.type === 'payout_processed') {
        totalPaid += Math.abs(t.amount_cents)
      } else if (t.type === 'adjustment') {
        totalAdjustments += t.amount_cents
      }
    })

    return NextResponse.json({
      transactions: transactions || [],
      total: count || 0,
      summary: {
        total_earned: totalEarned,
        total_paid: totalPaid,
        total_adjustments: totalAdjustments,
        balance: totalEarned - totalPaid + totalAdjustments,
      },
    })
  } catch (err: any) {
    if (err?.code === '42P01') {
      return NextResponse.json({ transactions: [], total: 0, summary: { total_earned: 0, total_paid: 0, balance: 0 } })
    }
    console.error('Transactions GET error:', err)
    return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 })
  }
}
