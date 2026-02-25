import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const [commissionsResult, referralsResult, payoutsResult, linkResult, settingsResult] = await Promise.all([
      admin.from('affiliate_commissions').select('id, referral_id, invoice_amount_cents, commission_rate, commission_amount_cents, status, created_at').eq('affiliate_user_id', user.id).order('created_at', { ascending: true }),
      admin.from('affiliate_referrals').select('id, status, created_at, source_tag').eq('affiliate_user_id', user.id).order('created_at', { ascending: true }),
      admin.from('affiliate_payouts').select('id, amount_cents, method, status, processed_at, created_at').eq('affiliate_user_id', user.id).order('created_at', { ascending: false }),
      admin.from('referral_links').select('total_earnings_cents, paid_earnings_cents, pending_earnings_cents, signups, clicks, created_at').eq('user_id', user.id).maybeSingle(),
      admin.from('affiliate_program_settings').select('min_payout_cents').limit(1).maybeSingle(),
    ])

    const commissions = commissionsResult.data || []
    const referrals = referralsResult.data || []
    const payouts = payoutsResult.data || []
    const link = linkResult.data
    const settings = settingsResult.data

    const earningsByReferral: Record<string, { referralId: string; totalEarnings: number; commissionCount: number; firstCommission: string; lastCommission: string; status: string }> = {}
    for (const c of commissions) {
      const refId = c.referral_id || 'unknown'
      if (!earningsByReferral[refId]) {
        const ref = referrals.find(r => r.id === refId)
        earningsByReferral[refId] = {
          referralId: refId,
          totalEarnings: 0,
          commissionCount: 0,
          firstCommission: c.created_at,
          lastCommission: c.created_at,
          status: ref?.status || 'unknown',
        }
      }
      earningsByReferral[refId].totalEarnings += c.commission_amount_cents
      earningsByReferral[refId].commissionCount++
      earningsByReferral[refId].lastCommission = c.created_at
    }
    const earningsByReferralList = Object.values(earningsByReferral).sort((a, b) => b.totalEarnings - a.totalEarnings)

    const totalInvoiceRevenue = commissions.reduce((sum, c) => sum + (c.invoice_amount_cents || 0), 0)
    const totalCommissionEarnings = commissions.reduce((sum, c) => sum + (c.commission_amount_cents || 0), 0)
    const platformShare = totalInvoiceRevenue - totalCommissionEarnings
    const avgCommissionRate = commissions.length > 0
      ? commissions.reduce((sum, c) => sum + (c.commission_rate || 0), 0) / commissions.length
      : 0

    const now = new Date()
    const currentYear = now.getFullYear()
    const yearlyData: Record<number, { earnings: number; commissions: number; referrals: number; payouts: number }> = {}

    for (const c of commissions) {
      const yr = new Date(c.created_at).getFullYear()
      if (!yearlyData[yr]) yearlyData[yr] = { earnings: 0, commissions: 0, referrals: 0, payouts: 0 }
      yearlyData[yr].earnings += c.commission_amount_cents
      yearlyData[yr].commissions++
    }
    for (const r of referrals) {
      const yr = new Date(r.created_at).getFullYear()
      if (!yearlyData[yr]) yearlyData[yr] = { earnings: 0, commissions: 0, referrals: 0, payouts: 0 }
      yearlyData[yr].referrals++
    }
    for (const p of payouts) {
      if (p.status === 'paid' || p.status === 'completed' || p.status === 'processed') {
        const yr = new Date(p.processed_at || p.created_at).getFullYear()
        if (!yearlyData[yr]) yearlyData[yr] = { earnings: 0, commissions: 0, referrals: 0, payouts: 0 }
        yearlyData[yr].payouts += p.amount_cents
      }
    }

    const multiYearHistory = Object.entries(yearlyData)
      .map(([year, data]) => ({ year: parseInt(year), ...data }))
      .sort((a, b) => a.year - b.year)

    const churnedReferrals = referrals.filter(r => r.status === 'churned')
    const activeReferrals = referrals.filter(r => r.status === 'converted')
    const churnAlerts = churnedReferrals.slice(-10).reverse().map(r => ({
      referralId: r.id,
      churnedAt: r.created_at,
      lostEarnings: earningsByReferral[r.id]?.totalEarnings || 0,
      activeRemaining: activeReferrals.length,
    }))

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthCommissions = commissions.filter(c => new Date(c.created_at) >= monthStart)
    const thisMonthEarnings = thisMonthCommissions.reduce((sum, c) => sum + c.commission_amount_cents, 0)
    const dayOfMonth = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dailyAvg = dayOfMonth > 0 ? thisMonthEarnings / dayOfMonth : 0
    const projectedMonthly = Math.round(dailyAvg * daysInMonth)
    const projectedAnnual = Math.round(dailyAvg * 365)

    const lastYearData = yearlyData[currentYear - 1]
    const currentYearData = yearlyData[currentYear]
    const yoyGrowth = lastYearData && lastYearData.earnings > 0
      ? Math.round(((currentYearData?.earnings || 0) - lastYearData.earnings) / lastYearData.earnings * 100)
      : null

    const monthlyGrowthData: { month: string; earnings: number; cumulative: number }[] = []
    let cumulative = 0
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (let m = 0; m < 12; m++) {
      const monthEarnings = commissions
        .filter(c => {
          const d = new Date(c.created_at)
          return d.getFullYear() === currentYear && d.getMonth() === m
        })
        .reduce((sum, c) => sum + c.commission_amount_cents, 0)
      cumulative += monthEarnings
      monthlyGrowthData.push({
        month: monthNames[m],
        earnings: monthEarnings,
        cumulative,
      })
    }

    const lastLoginDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sleepEarnings = commissions
      .filter(c => new Date(c.created_at) > lastLoginDate)
      .reduce((sum, c) => sum + c.commission_amount_cents, 0)

    return NextResponse.json({
      earningsByReferral: earningsByReferralList,
      revenueShare: {
        totalInvoiceRevenue,
        yourEarnings: totalCommissionEarnings,
        platformShare,
        avgCommissionRate: Math.round(avgCommissionRate * 10) / 10,
        yourPercentage: totalInvoiceRevenue > 0 ? Math.round((totalCommissionEarnings / totalInvoiceRevenue) * 100) : 0,
      },
      multiYearHistory,
      churnAlerts,
      projection: {
        dailyAvg: Math.round(dailyAvg),
        projectedMonthly,
        projectedAnnual,
        currentMonthEarnings: thisMonthEarnings,
        daysRemaining: daysInMonth - dayOfMonth,
        yoyGrowth,
      },
      monthlyGrowthData,
      sleepEarnings,
      expenseOffset: {
        subscriptionCostCents: 4900,
        totalEarnings: totalCommissionEarnings,
        netIncome: totalCommissionEarnings - 4900,
        monthlyEarnings: thisMonthEarnings,
        monthlyNet: thisMonthEarnings - 4900,
        isProfitable: totalCommissionEarnings > 4900,
      },
      summary: {
        totalReferrals: referrals.length,
        activeReferrals: activeReferrals.length,
        churnedReferrals: churnedReferrals.length,
        totalCommissions: commissions.length,
        totalEarnings: totalCommissionEarnings,
        totalPaid: payouts.filter(p => ['paid', 'completed', 'processed'].includes(p.status)).reduce((s, p) => s + p.amount_cents, 0),
        memberSince: link?.created_at || null,
      },
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({
        earningsByReferral: [],
        revenueShare: { totalInvoiceRevenue: 0, yourEarnings: 0, platformShare: 0, avgCommissionRate: 0, yourPercentage: 0 },
        multiYearHistory: [],
        churnAlerts: [],
        projection: { dailyAvg: 0, projectedMonthly: 0, projectedAnnual: 0, currentMonthEarnings: 0, daysRemaining: 0, yoyGrowth: null },
        monthlyGrowthData: [],
        sleepEarnings: 0,
        expenseOffset: { subscriptionCostCents: 4900, totalEarnings: 0, netIncome: -4900, monthlyEarnings: 0, monthlyNet: -4900, isProfitable: false },
        summary: { totalReferrals: 0, activeReferrals: 0, churnedReferrals: 0, totalCommissions: 0, totalEarnings: 0, totalPaid: 0, memberSince: null },
      })
    }
    console.error('Financial tools error:', err)
    return NextResponse.json({ error: 'Failed to load financial data' }, { status: 500 })
  }
}
