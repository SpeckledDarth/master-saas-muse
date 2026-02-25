import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '30d'

    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30
    const since = new Date(Date.now() - days * 86400000)
    const sinceISO = since.toISOString()

    const { data: link } = await admin
      .from('referral_links')
      .select('ref_code, is_affiliate')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!link?.is_affiliate) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    let commissions: any[] = []
    try {
      const { data, error } = await admin
        .from('affiliate_commissions')
        .select('commission_amount_cents, status, created_at, referral_id')
        .eq('affiliate_user_id', user.id)
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: true })

      if (error && error.code !== '42P01') throw error
      commissions = data || []
    } catch (e: any) {
      if (e?.code !== '42P01') throw e
    }

    let allCommissions: any[] = []
    try {
      const { data, error } = await admin
        .from('affiliate_commissions')
        .select('commission_amount_cents, status, created_at')
        .eq('affiliate_user_id', user.id)
        .order('created_at', { ascending: true })

      if (error && error.code !== '42P01') throw error
      allCommissions = data || []
    } catch (e: any) {
      if (e?.code !== '42P01') throw e
    }

    let referrals: any[] = []
    try {
      const { data, error } = await admin
        .from('affiliate_referrals')
        .select('id, status, source_tag, created_at')
        .eq('affiliate_user_id', user.id)
        .gte('created_at', sinceISO)

      if (error && error.code !== '42P01') throw error
      referrals = data || []
    } catch (e: any) {
      if (e?.code !== '42P01') throw e
    }

    let clicks = 0
    try {
      const { count, error } = await admin
        .from('referral_clicks')
        .select('id', { count: 'exact', head: true })
        .eq('ref_code', link.ref_code)
        .gte('created_at', sinceISO)

      if (error && error.code !== '42P01') throw error
      clicks = count || 0
    } catch (e: any) {
      if (e?.code !== '42P01') throw e
    }

    const earningsTimeSeries = buildTimeSeries(commissions, days)

    const heatmapData = buildHeatmap(allCommissions)

    const funnelData = {
      clicks,
      signups: referrals.length,
      conversions: referrals.filter(r => r.status === 'converted').length,
      paid: commissions.length,
    }

    const sourceDistribution: Record<string, { earnings: number; count: number }> = {}
    referrals.forEach(ref => {
      const tag = ref.source_tag || 'Direct'
      if (!sourceDistribution[tag]) sourceDistribution[tag] = { earnings: 0, count: 0 }
      sourceDistribution[tag].count++
    })
    commissions.forEach(c => {
      const ref = referrals.find(r => r.id === c.referral_id)
      const tag = ref?.source_tag || 'Direct'
      if (!sourceDistribution[tag]) sourceDistribution[tag] = { earnings: 0, count: 0 }
      sourceDistribution[tag].earnings += c.commission_amount_cents || 0
    })
    const topSources = Object.entries(sourceDistribution)
      .map(([source, data]) => ({ source, ...data }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 10)

    let benchmarks = { percentile: 50, avgEarnings: 0, avgReferrals: 0, yourEarnings: 0, yourReferrals: 0 }
    try {
      const { data: allAffiliates } = await admin
        .from('affiliate_commissions')
        .select('affiliate_user_id, commission_amount_cents')
        .gte('created_at', sinceISO)

      if (allAffiliates && allAffiliates.length > 0) {
        const affiliateEarnings: Record<string, number> = {}
        allAffiliates.forEach(c => {
          if (!affiliateEarnings[c.affiliate_user_id]) affiliateEarnings[c.affiliate_user_id] = 0
          affiliateEarnings[c.affiliate_user_id] += c.commission_amount_cents || 0
        })

        const allEarningsValues = Object.values(affiliateEarnings).sort((a, b) => a - b)
        const yourTotal = affiliateEarnings[user.id] || 0
        const belowYou = allEarningsValues.filter(v => v < yourTotal).length
        const percentile = allEarningsValues.length > 1
          ? Math.round((belowYou / (allEarningsValues.length - 1)) * 100)
          : 50

        const avgEarnings = allEarningsValues.length > 0
          ? Math.round(allEarningsValues.reduce((a, b) => a + b, 0) / allEarningsValues.length)
          : 0

        benchmarks = {
          percentile,
          avgEarnings,
          avgReferrals: 0,
          yourEarnings: yourTotal,
          yourReferrals: referrals.length,
        }
      }

      const { data: allRefs } = await admin
        .from('affiliate_referrals')
        .select('affiliate_user_id')
        .gte('created_at', sinceISO)

      if (allRefs && allRefs.length > 0) {
        const refCounts: Record<string, number> = {}
        allRefs.forEach(r => {
          if (!refCounts[r.affiliate_user_id]) refCounts[r.affiliate_user_id] = 0
          refCounts[r.affiliate_user_id]++
        })
        const allRefValues = Object.values(refCounts)
        benchmarks.avgReferrals = allRefValues.length > 0
          ? Math.round(allRefValues.reduce((a, b) => a + b, 0) / allRefValues.length)
          : 0
      }
    } catch (e: any) {
      if (e?.code !== '42P01') console.error('Benchmark error:', e)
    }

    return NextResponse.json({
      period,
      earningsTimeSeries,
      heatmapData,
      funnelData,
      topSources,
      benchmarks,
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({
        period: '30d',
        earningsTimeSeries: [],
        heatmapData: [],
        funnelData: { clicks: 0, signups: 0, conversions: 0, paid: 0 },
        topSources: [],
        benchmarks: { percentile: 50, avgEarnings: 0, avgReferrals: 0, yourEarnings: 0, yourReferrals: 0 },
      })
    }
    console.error('Charts API error:', err)
    return NextResponse.json({ error: 'Failed to load chart data' }, { status: 500 })
  }
}

function buildTimeSeries(commissions: any[], days: number) {
  const map: Record<string, number> = {}
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    map[key] = 0
  }

  commissions.forEach(c => {
    const key = new Date(c.created_at).toISOString().split('T')[0]
    if (map[key] !== undefined) {
      map[key] += c.commission_amount_cents || 0
    }
  })

  return Object.entries(map).map(([date, amount]) => ({ date, amount }))
}

function buildHeatmap(allCommissions: any[]) {
  const now = new Date()
  const weeksBack = 52
  const map: Record<string, number> = {}

  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - (weeksBack * 7))
  const startDay = startDate.getDay()
  startDate.setDate(startDate.getDate() - startDay)

  for (let i = 0; i <= weeksBack * 7 + 6; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    if (d > now) break
    const key = d.toISOString().split('T')[0]
    map[key] = 0
  }

  allCommissions.forEach(c => {
    const key = new Date(c.created_at).toISOString().split('T')[0]
    if (map[key] !== undefined) {
      map[key] += c.commission_amount_cents || 0
    }
  })

  return Object.entries(map).map(([date, amount]) => ({ date, amount }))
}
