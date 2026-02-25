import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const contestId = url.searchParams.get('contest_id')
    if (!contestId) return NextResponse.json({ error: 'contest_id required' }, { status: 400 })

    const admin = createAdminClient()

    const { data: contest } = await admin
      .from('affiliate_contests')
      .select('*')
      .eq('id', contestId)
      .maybeSingle()

    if (!contest) return NextResponse.json({ error: 'Contest not found' }, { status: 404 })

    const metric = contest.metric || 'referrals'
    const startDate = contest.start_date
    const endDate = contest.end_date

    const { data: affiliateLinks } = await admin
      .from('referral_links')
      .select('user_id')
      .eq('is_affiliate', true)

    if (!affiliateLinks || affiliateLinks.length === 0) {
      return NextResponse.json({ leaderboard: [], ownPosition: null, contest })
    }

    const userIds = affiliateLinks.map((l: any) => l.user_id)
    const scoreMap: Record<string, number> = {}

    if (metric === 'earnings') {
      let query = admin
        .from('affiliate_commissions')
        .select('affiliate_user_id, commission_amount_cents')
        .in('affiliate_user_id', userIds)
      if (startDate) query = query.gte('created_at', startDate)
      if (endDate) query = query.lte('created_at', endDate)

      const { data: commissions } = await query
      commissions?.forEach((c: any) => {
        scoreMap[c.affiliate_user_id] = (scoreMap[c.affiliate_user_id] || 0) + c.commission_amount_cents
      })
    } else {
      let query = admin
        .from('affiliate_referrals')
        .select('affiliate_user_id')
        .in('affiliate_user_id', userIds)
      if (startDate) query = query.gte('created_at', startDate)
      if (endDate) query = query.lte('created_at', endDate)

      const { data: referrals } = await query
      referrals?.forEach((r: any) => {
        scoreMap[r.affiliate_user_id] = (scoreMap[r.affiliate_user_id] || 0) + 1
      })
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

    const topEntries = ranked.slice(0, 20)
    const idsToResolve = topEntries.map(e => e._userId)
    if (ownIdx >= 20) idsToResolve.push(user.id)

    let displayNames: Record<string, string> = {}
    if (idsToResolve.length > 0) {
      try {
        const { data: profiles } = await admin
          .from('profiles')
          .select('id, full_name, email')
          .in('id', idsToResolve)
        profiles?.forEach((p: any) => {
          const name = p.full_name || p.email || ''
          const parts = name.split(/[\s@]+/)
          displayNames[p.id] = parts.map((pt: string) => pt[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('.')
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
      contest: {
        id: contest.id,
        name: contest.name,
        metric: contest.metric,
        start_date: contest.start_date,
        end_date: contest.end_date,
        prize_description: contest.prize_description,
        prize_amount_cents: contest.prize_amount_cents,
        status: contest.status,
      },
      leaderboard: result,
      ownPosition,
      ownScore: ownIdx !== -1 ? ranked[ownIdx].metricValue : 0,
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ leaderboard: [], ownPosition: null })
    }
    console.error('Contest leaderboard error:', err)
    return NextResponse.json({ error: 'Failed to load contest leaderboard' }, { status: 500 })
  }
}
