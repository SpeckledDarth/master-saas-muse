import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const [settingsRes, linkRes, commissionsRes] = await Promise.all([
      admin.from('affiliate_program_settings').select('payout_schedule_day, min_payout_cents, auto_batch_enabled').maybeSingle(),
      admin.from('referral_links').select('pending_earnings_cents').eq('user_id', user.id).maybeSingle(),
      admin.from('affiliate_commissions').select('commission_amount_cents').eq('affiliate_user_id', user.id).eq('status', 'approved'),
    ])

    const scheduleDay = settingsRes.data?.payout_schedule_day || 15
    const minPayoutCents = settingsRes.data?.min_payout_cents || 5000
    const autoBatch = settingsRes.data?.auto_batch_enabled || false

    const pendingFromCommissions = commissionsRes.data?.reduce((s: number, c: any) => s + c.commission_amount_cents, 0) || 0
    const pendingFromLink = linkRes.data?.pending_earnings_cents || 0
    const pendingAmount = Math.max(pendingFromCommissions, pendingFromLink)

    const now = new Date()
    let nextPayoutDate: Date
    if (now.getDate() < scheduleDay) {
      nextPayoutDate = new Date(now.getFullYear(), now.getMonth(), scheduleDay)
    } else {
      nextPayoutDate = new Date(now.getFullYear(), now.getMonth() + 1, scheduleDay)
    }

    const meetsMinimum = pendingAmount >= minPayoutCents

    return NextResponse.json({
      scheduleDay,
      nextPayoutDate: nextPayoutDate.toISOString(),
      pendingAmountCents: pendingAmount,
      minPayoutCents,
      meetsMinimum,
      autoBatchEnabled: autoBatch,
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ scheduleDay: 15, nextPayoutDate: null, pendingAmountCents: 0, minPayoutCents: 5000, meetsMinimum: false, autoBatchEnabled: false })
    }
    console.error('Payout schedule error:', err)
    return NextResponse.json({ error: 'Failed to load payout schedule' }, { status: 500 })
  }
}
