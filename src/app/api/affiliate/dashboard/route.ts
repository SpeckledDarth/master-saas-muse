import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAffiliateTiers, getCurrentTier, getNextTier, getCommissionRate, type AffiliateLink } from '@/lib/affiliate'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: link } = await admin
      .from('referral_links')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!link) {
      return NextResponse.json({ affiliate: null, note: 'No referral link found' })
    }

    const tiers = await getAffiliateTiers()
    const currentTier = getCurrentTier(link.signups || 0, tiers)
    const nextTier = getNextTier(link.signups || 0, tiers)
    const effectiveRate = getCommissionRate(link as AffiliateLink, tiers)

    const { data: referrals } = await admin
      .from('affiliate_referrals')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: commissions } = await admin
      .from('affiliate_commissions')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: payouts } = await admin
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: settings } = await admin
      .from('affiliate_program_settings')
      .select('cookie_duration_days, min_payout_cents')
      .limit(1)
      .maybeSingle()

    const totalReferrals = referrals?.length || 0
    const conversions = referrals?.filter((r: any) => r.status === 'converted').length || 0
    const conversionRate = totalReferrals > 0 ? Math.round((conversions / totalReferrals) * 100) : 0

    const pendingEarnings = commissions?.filter((c: any) => c.status === 'pending').reduce((sum: number, c: any) => sum + c.commission_amount_cents, 0) || 0
    const approvedEarnings = commissions?.filter((c: any) => c.status === 'approved').reduce((sum: number, c: any) => sum + c.commission_amount_cents, 0) || 0
    const paidEarnings = commissions?.filter((c: any) => c.status === 'paid').reduce((sum: number, c: any) => sum + c.commission_amount_cents, 0) || 0

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://passivepost.io'
    const shareUrl = `${baseUrl}?ref=${link.ref_code}`

    return NextResponse.json({
      affiliate: {
        link: { ...link, shareUrl },
        stats: {
          totalReferrals,
          conversions,
          conversionRate,
          clicks: link.clicks || 0,
          pendingEarnings,
          approvedEarnings,
          paidEarnings,
          totalEarnings: link.total_earnings_cents || 0,
          effectiveRate,
        },
        tier: {
          current: currentTier,
          next: nextTier,
          referralsToNext: nextTier ? nextTier.min_referrals - (link.signups || 0) : 0,
        },
        terms: link.locked_at ? {
          rate: link.locked_commission_rate,
          durationMonths: link.locked_duration_months,
          lockedAt: link.locked_at,
        } : null,
        referrals: referrals || [],
        commissions: commissions || [],
        payouts: payouts || [],
        settings: {
          minPayoutCents: settings?.min_payout_cents || 5000,
        },
      },
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ affiliate: null, note: 'Affiliate tables not created yet' })
    }
    console.error('Affiliate dashboard error:', err)
    return NextResponse.json({ error: 'Failed to load affiliate dashboard' }, { status: 500 })
  }
}
