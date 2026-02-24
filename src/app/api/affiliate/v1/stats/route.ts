import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateApiKey } from '@/lib/affiliate/api-auth'

export async function GET(request: NextRequest) {
  const result = await validateApiKey(request)
  if (!result.success) return result.response

  const { auth, headers } = result

  try {
    const admin = createAdminClient()

    const { data: link } = await admin
      .from('referral_links')
      .select('ref_code, clicks, signups, total_earnings_cents')
      .eq('user_id', auth.affiliateUserId)
      .maybeSingle()

    const { data: referrals } = await admin
      .from('affiliate_referrals')
      .select('status')
      .eq('affiliate_user_id', auth.affiliateUserId)

    const { data: commissions } = await admin
      .from('affiliate_commissions')
      .select('commission_amount_cents, status')
      .eq('affiliate_user_id', auth.affiliateUserId)

    const totalReferrals = referrals?.length || 0
    const conversions = referrals?.filter((r: any) => r.status === 'converted').length || 0
    const conversionRate = totalReferrals > 0 ? Math.round((conversions / totalReferrals) * 100) : 0

    const pendingEarnings = commissions?.filter((c: any) => c.status === 'pending').reduce((sum: number, c: any) => sum + c.commission_amount_cents, 0) || 0
    const approvedEarnings = commissions?.filter((c: any) => c.status === 'approved').reduce((sum: number, c: any) => sum + c.commission_amount_cents, 0) || 0
    const paidEarnings = commissions?.filter((c: any) => c.status === 'paid').reduce((sum: number, c: any) => sum + c.commission_amount_cents, 0) || 0

    return NextResponse.json({
      ref_code: link?.ref_code || null,
      clicks: link?.clicks || 0,
      signups: link?.signups || 0,
      total_referrals: totalReferrals,
      conversions,
      conversion_rate: conversionRate,
      earnings: {
        pending_cents: pendingEarnings,
        approved_cents: approvedEarnings,
        paid_cents: paidEarnings,
        total_cents: link?.total_earnings_cents || 0,
      },
    }, { headers })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Affiliate tables not configured' }, { status: 503, headers })
    }
    console.error('v1/stats error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
