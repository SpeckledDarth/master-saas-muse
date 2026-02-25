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
      .select('cookie_duration_days, min_payout_cents, two_tier_enabled, second_tier_commission_rate, payout_schedule_day, auto_batch_enabled')
      .limit(1)
      .maybeSingle()

    let secondTierCommissions: any[] = []
    let secondTierTotal = 0
    try {
      if (settings?.two_tier_enabled) {
        const { data: tier2 } = await admin
          .from('affiliate_second_tier_commissions')
          .select('*')
          .eq('tier1_affiliate_id', user.id)
          .order('created_at', { ascending: false })

        secondTierCommissions = tier2 || []
        secondTierTotal = secondTierCommissions.reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)
      }
    } catch {}

    const totalReferrals = referrals?.length || 0
    const conversions = referrals?.filter((r: any) => r.status === 'converted').length || 0
    const conversionRate = totalReferrals > 0 ? Math.round((conversions / totalReferrals) * 100) : 0

    const pendingEarnings = commissions?.filter((c: any) => c.status === 'pending').reduce((sum: number, c: any) => sum + c.commission_amount_cents, 0) || 0
    const approvedEarnings = commissions?.filter((c: any) => c.status === 'approved').reduce((sum: number, c: any) => sum + c.commission_amount_cents, 0) || 0
    const paidEarnings = commissions?.filter((c: any) => c.status === 'paid').reduce((sum: number, c: any) => sum + c.commission_amount_cents, 0) || 0

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'
    const shareUrl = `${baseUrl}?ref=${link.ref_code}`

    let nextMilestone: any = null
    try {
      const { data: milestones } = await admin
        .from('affiliate_milestones')
        .select('id, name, referral_threshold, bonus_amount_cents')
        .eq('is_active', true)
        .order('referral_threshold', { ascending: true })

      if (milestones && milestones.length > 0) {
        const currentRefs = link.signups || 0
        const next = milestones.find((m: any) => currentRefs < m.referral_threshold)
        if (next) {
          nextMilestone = {
            name: next.name,
            referralThreshold: next.referral_threshold,
            bonusAmountCents: next.bonus_amount_cents,
            referralsAway: next.referral_threshold - currentRefs,
            progress: Math.min((currentRefs / next.referral_threshold) * 100, 100),
          }
        }
      }
    } catch {}

    const scheduleDay = settings?.payout_schedule_day || 15
    const now = new Date()
    let nextPayoutDate: string
    if (now.getDate() < scheduleDay) {
      nextPayoutDate = new Date(now.getFullYear(), now.getMonth(), scheduleDay).toISOString()
    } else {
      nextPayoutDate = new Date(now.getFullYear(), now.getMonth() + 1, scheduleDay).toISOString()
    }

    let tierPromotionCelebration: any = null
    if (currentTier) {
      try {
        const { data: lastPromoNotif } = await admin
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'celebration')
          .ilike('title', `%${currentTier.name}%`)
          .limit(1)
          .maybeSingle()

        if (!lastPromoNotif && (link.signups || 0) >= currentTier.min_referrals && currentTier.min_referrals > 0) {
          tierPromotionCelebration = {
            tierName: currentTier.name,
            commissionRate: currentTier.commission_rate,
          }
        }
      } catch {}
    }

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
          twoTierEnabled: settings?.two_tier_enabled || false,
          secondTierCommissionRate: settings?.second_tier_commission_rate || 5,
        },
        secondTierCommissions,
        secondTierTotal,
        nextMilestone,
        payoutSchedule: {
          scheduleDay,
          nextPayoutDate,
          pendingAmountCents: approvedEarnings,
          minPayoutCents: settings?.min_payout_cents || 5000,
          meetsMinimum: approvedEarnings >= (settings?.min_payout_cents || 5000),
        },
        tierPromotionCelebration,
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
