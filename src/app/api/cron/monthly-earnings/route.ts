import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/affiliate'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const now = new Date()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    const monthName = lastMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const { data: links } = await admin
      .from('referral_links')
      .select('user_id')

    if (!links || links.length === 0) {
      return NextResponse.json({ message: 'No affiliates found', processed: 0 })
    }

    let processed = 0
    for (const link of links) {
      try {
        const { data: commissions } = await admin
          .from('affiliate_commissions')
          .select('commission_amount_cents')
          .eq('affiliate_user_id', link.user_id)
          .gte('created_at', lastMonthStart.toISOString())
          .lte('created_at', lastMonthEnd.toISOString())

        const items = commissions || []
        const totalEarnings = items.reduce((s, c) => s + c.commission_amount_cents, 0)

        if (totalEarnings > 0) {
          const { data: newRefs } = await admin
            .from('affiliate_referrals')
            .select('id')
            .eq('affiliate_user_id', link.user_id)
            .gte('created_at', lastMonthStart.toISOString())
            .lte('created_at', lastMonthEnd.toISOString())

          const newRefCount = newRefs?.length || 0
          const earningsFormatted = `$${(totalEarnings / 100).toFixed(2)}`

          await createNotification(
            link.user_id,
            `Monthly Earnings Summary — ${monthName}`,
            `You earned ${earningsFormatted} from ${items.length} commission${items.length !== 1 ? 's' : ''} last month. ${newRefCount > 0 ? `You also gained ${newRefCount} new referral${newRefCount !== 1 ? 's' : ''}.` : ''} Keep up the great work!`,
            'earnings'
          )
          processed++
        }
      } catch (e) {
        console.error(`Failed to process monthly earnings for ${link.user_id}:`, e)
      }
    }

    return NextResponse.json({ message: 'Monthly earnings emails sent', processed })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ message: 'Tables not set up yet', processed: 0 })
    }
    console.error('Monthly earnings cron error:', err)
    return NextResponse.json({ error: 'Failed to send monthly earnings' }, { status: 500 })
  }
}
