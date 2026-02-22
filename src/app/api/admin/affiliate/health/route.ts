import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [linksRes, referralsRes, commissionsRes, payoutsRes] = await Promise.all([
      admin.from('referral_links').select('user_id, is_affiliate, clicks, signups, total_earnings_cents, paid_earnings_cents, pending_earnings_cents, updated_at, created_at').eq('is_affiliate', true),
      admin.from('affiliate_referrals').select('id, affiliate_user_id, status, fraud_flags, created_at, converted_at'),
      admin.from('affiliate_commissions').select('id, affiliate_user_id, invoice_amount_cents, commission_amount_cents, status, created_at'),
      admin.from('affiliate_payouts').select('id, amount_cents, status, created_at'),
    ])

    if (linksRes.error?.code === '42P01') {
      return NextResponse.json({ health: null, note: 'Tables not created yet' })
    }

    const links = linksRes.data || []
    const referrals = referralsRes.data || []
    const commissions = commissionsRes.data || []
    const payouts = payoutsRes.data || []

    const totalAffiliates = links.length
    const activeAffiliates = links.filter((l: any) => {
      const lastActivity = new Date(l.updated_at)
      return (now.getTime() - lastActivity.getTime()) < 30 * 24 * 60 * 60 * 1000
    }).length
    const dormantAffiliates = totalAffiliates - activeAffiliates

    const totalRevenue = commissions.reduce((sum: number, c: any) => sum + (c.invoice_amount_cents || 0), 0)
    const totalCommissionsPaid = commissions
      .filter((c: any) => c.status === 'paid')
      .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)
    const totalCommissionsPending = commissions
      .filter((c: any) => c.status === 'pending' || c.status === 'approved')
      .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)
    const netROI = totalRevenue - totalCommissionsPaid

    const newAffiliatesThisMonth = links.filter((l: any) => l.created_at && l.created_at >= thisMonthStart).length
    const referralsThisMonth = referrals.filter((r: any) => r.created_at >= thisMonthStart).length
    const conversionsThisMonth = referrals.filter((r: any) => r.converted_at && r.converted_at >= thisMonthStart).length

    const totalReferrals = referrals.length
    const totalConversions = referrals.filter((r: any) => r.status === 'converted').length
    const conversionRate = totalReferrals > 0 ? Math.round((totalConversions / totalReferrals) * 100) : 0

    const avgReferralsPerAffiliate = totalAffiliates > 0 ? Math.round(totalReferrals / totalAffiliates) : 0
    const avgEarningsPerAffiliate = totalAffiliates > 0
      ? Math.round(links.reduce((sum: number, l: any) => sum + (l.total_earnings_cents || 0), 0) / totalAffiliates)
      : 0

    const affiliateEarningsMap = new Map<string, number>()
    for (const c of commissions) {
      const current = affiliateEarningsMap.get(c.affiliate_user_id) || 0
      affiliateEarningsMap.set(c.affiliate_user_id, current + (c.commission_amount_cents || 0))
    }

    const topPerformers = Array.from(affiliateEarningsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, earnings]) => {
        const link = links.find((l: any) => l.user_id === userId)
        return {
          userId,
          referrals: link?.signups || 0,
          earnings,
        }
      })

    const flaggedReferrals = referrals.filter((r: any) => {
      const flags = r.fraud_flags
      return flags && ((Array.isArray(flags) && flags.length > 0) || (typeof flags === 'string' && flags !== '[]'))
    }).length

    const pendingPayoutAmount = payouts
      .filter((p: any) => p.status === 'pending')
      .reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0)

    return NextResponse.json({
      health: {
        overview: {
          totalAffiliates,
          activeAffiliates,
          dormantAffiliates,
          suspended: 0,
        },
        revenue: {
          totalRevenue,
          totalCommissionsPaid,
          totalCommissionsPending,
          netROI,
        },
        growth: {
          newAffiliatesThisMonth,
          referralsThisMonth,
          conversionsThisMonth,
          conversionRate,
        },
        engagement: {
          avgReferralsPerAffiliate,
          avgEarningsPerAffiliate,
        },
        topPerformers,
        alerts: {
          flaggedReferrals,
          pendingPayoutAmount,
        },
      },
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ health: null, note: 'Tables not created yet' })
    }
    console.error('Affiliate health GET error:', err)
    return NextResponse.json({ error: 'Failed to load health data' }, { status: 500 })
  }
}
