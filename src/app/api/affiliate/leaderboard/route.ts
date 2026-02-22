import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || 'month'
    const metric = url.searchParams.get('metric') || 'referrals'
    const limitParam = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)

    let settingsData: any = null
    try {
      const { data } = await adminClient
        .from('affiliate_program_settings')
        .select('leaderboard_enabled, leaderboard_privacy_mode')
        .limit(1)
        .maybeSingle()
      settingsData = data
    } catch {}

    if (settingsData?.leaderboard_enabled === false) {
      return NextResponse.json({ enabled: false, leaderboard: [], ownPosition: null })
    }

    const privacyMode = settingsData?.leaderboard_privacy_mode || 'initials'

    const now = new Date()
    let sinceDate: string | null = null
    let untilDate: string | null = null

    if (period === 'month') {
      sinceDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    } else if (period === 'last_month') {
      sinceDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      untilDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    }

    let affiliateLinks: any[] = []
    try {
      const { data, error } = await adminClient
        .from('referral_links')
        .select('user_id')
        .eq('is_affiliate', true)

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return NextResponse.json({ enabled: true, leaderboard: [], ownPosition: null })
        }
        throw error
      }
      affiliateLinks = data || []
    } catch (e: any) {
      if (e?.code === '42P01') return NextResponse.json({ enabled: true, leaderboard: [], ownPosition: null })
      throw e
    }

    if (affiliateLinks.length === 0) {
      return NextResponse.json({ enabled: true, leaderboard: [], ownPosition: null })
    }

    const userIds = affiliateLinks.map(l => l.user_id)
    const scoreMap: Record<string, number> = {}

    if (metric === 'earnings') {
      try {
        let query = adminClient
          .from('affiliate_commissions')
          .select('affiliate_user_id, commission_amount_cents')
          .in('affiliate_user_id', userIds)

        if (sinceDate) query = query.gte('created_at', sinceDate)
        if (untilDate) query = query.lt('created_at', untilDate)

        const { data: commissions, error } = await query
        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            return NextResponse.json({ enabled: true, leaderboard: [], ownPosition: null })
          }
          throw error
        }

        commissions?.forEach(c => {
          scoreMap[c.affiliate_user_id] = (scoreMap[c.affiliate_user_id] || 0) + c.commission_amount_cents
        })
      } catch (e: any) {
        if (e?.code === '42P01') return NextResponse.json({ enabled: true, leaderboard: [], ownPosition: null })
        throw e
      }
    } else {
      try {
        let query = adminClient
          .from('affiliate_referrals')
          .select('affiliate_user_id')
          .in('affiliate_user_id', userIds)

        if (sinceDate) query = query.gte('created_at', sinceDate)
        if (untilDate) query = query.lt('created_at', untilDate)

        const { data: referrals, error } = await query
        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            return NextResponse.json({ enabled: true, leaderboard: [], ownPosition: null })
          }
          throw error
        }

        referrals?.forEach(r => {
          scoreMap[r.affiliate_user_id] = (scoreMap[r.affiliate_user_id] || 0) + 1
        })
      } catch (e: any) {
        if (e?.code === '42P01') return NextResponse.json({ enabled: true, leaderboard: [], ownPosition: null })
        throw e
      }
    }

    const sorted = Object.entries(scoreMap)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)

    const ranked = sorted.map(([userId, val], i) => ({
      _userId: userId,
      metricValue: val,
      rank: i + 1,
    }))

    const ownIdx = ranked.findIndex(r => r._userId === user.id)
    const ownPosition = ownIdx !== -1 ? ownIdx + 1 : null

    const topEntries = ranked.slice(0, limitParam)
    const idsToResolve = topEntries.map(e => e._userId)
    if (ownIdx >= limitParam) idsToResolve.push(user.id)

    let displayNames: Record<string, string> = {}
    if (idsToResolve.length > 0) {
      try {
        const { data: profiles } = await adminClient
          .from('profiles')
          .select('id, full_name, email')
          .in('id', idsToResolve)

        profiles?.forEach(p => {
          if (privacyMode === 'initials') {
            const name = p.full_name || p.email || ''
            const parts = name.split(/[\s@]+/)
            displayNames[p.id] = parts.map((pt: string) => pt[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('.')
          } else {
            displayNames[p.id] = p.full_name || p.email?.split('@')[0] || 'Affiliate'
          }
        })
      } catch {}
    }

    const result = topEntries.map(entry => ({
      rank: entry.rank,
      displayName: displayNames[entry._userId] || '??',
      metricValue: entry.metricValue,
      isYou: entry._userId === user.id,
    }))

    return NextResponse.json({
      enabled: true,
      leaderboard: result,
      ownPosition,
      period,
      metric,
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ enabled: true, leaderboard: [], ownPosition: null })
  }
}
