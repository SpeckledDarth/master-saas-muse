import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const tier = url.searchParams.get('tier') || ''
    const specialty = url.searchParams.get('specialty') || ''
    const limitParam = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let profilesQuery = admin
      .from('affiliate_profiles')
      .select('user_id, display_name, bio, website, phone, city, state, country')
      .eq('show_in_directory', true)
      .range(offset, offset + limitParam - 1)

    if (search) {
      profilesQuery = profilesQuery.or(`display_name.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    const { data: profiles, error: profilesError } = await profilesQuery

    if (profilesError) {
      if (profilesError.code === '42703' || profilesError.message?.includes('show_in_directory')) {
        return NextResponse.json(
          { affiliates: [], total: 0, message: 'Directory not yet configured' },
          { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
        )
      }
      console.error('Affiliate directory profiles error:', profilesError)
      return NextResponse.json({ affiliates: [], total: 0 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { affiliates: [], total: 0 },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
      )
    }

    const userIds = profiles.map(p => p.user_id)

    const [tiersResult, landingPagesResult, referralsResult, leaderboardResult] = await Promise.all([
      admin
        .from('affiliate_tiers')
        .select('id, name, badge_color, min_referrals')
        .order('min_referrals', { ascending: true })
        .then(r => r),

      admin
        .from('affiliate_landing_pages')
        .select('affiliate_user_id, slug, is_active')
        .in('affiliate_user_id', userIds)
        .eq('is_active', true)
        .then(r => r),

      admin
        .from('affiliate_referrals')
        .select('affiliate_user_id')
        .in('affiliate_user_id', userIds)
        .then(r => r),

      admin
        .from('referral_links')
        .select('user_id')
        .eq('is_affiliate', true)
        .in('user_id', userIds)
        .then(r => r),
    ])

    const tiers = tiersResult.data || []
    const landingPages = landingPagesResult.data || []
    const referrals = referralsResult.data || []

    const referralCounts: Record<string, number> = {}
    referrals.forEach(r => {
      referralCounts[r.affiliate_user_id] = (referralCounts[r.affiliate_user_id] || 0) + 1
    })

    const landingPageMap: Record<string, string> = {}
    landingPages.forEach(lp => {
      landingPageMap[lp.affiliate_user_id] = lp.slug
    })

    function getReferralRange(count: number): string {
      if (count === 0) return '0'
      if (count <= 5) return '1-5'
      if (count <= 20) return '6-20'
      if (count <= 50) return '21-50'
      if (count <= 100) return '51-100'
      return '100+'
    }

    function getTierForAffiliate(referralCount: number): { name: string; badge_color: string } | null {
      if (tiers.length === 0) return null
      let matched: any = null
      for (const t of tiers) {
        if (referralCount >= (t.min_referrals || 0)) {
          matched = t
        }
      }
      return matched ? { name: matched.name, badge_color: matched.badge_color } : null
    }

    let topPerformerIds = new Set<string>()
    const sortedByReferrals = Object.entries(referralCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
    sortedByReferrals.forEach(([id]) => topPerformerIds.add(id))

    let affiliates = profiles.map(profile => {
      const refCount = referralCounts[profile.user_id] || 0
      const tierInfo = getTierForAffiliate(refCount)

      return {
        user_id: profile.user_id,
        display_name: profile.display_name || 'Affiliate',
        bio: profile.bio || '',
        website: profile.website || null,
        location: [profile.city, profile.state, profile.country].filter(Boolean).join(', ') || null,
        tier: tierInfo,
        referral_range: getReferralRange(refCount),
        is_top_performer: topPerformerIds.has(profile.user_id),
        landing_page_slug: landingPageMap[profile.user_id] || null,
      }
    })

    if (tier) {
      affiliates = affiliates.filter(a => a.tier?.name?.toLowerCase() === tier.toLowerCase())
    }

    affiliates.sort((a, b) => {
      if (a.is_top_performer && !b.is_top_performer) return -1
      if (!a.is_top_performer && b.is_top_performer) return 1
      return 0
    })

    const countQuery = admin
      .from('affiliate_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('show_in_directory', true)

    const { count: totalCount } = await countQuery

    return NextResponse.json(
      {
        affiliates,
        total: totalCount || affiliates.length,
        tiers: tiers.map(t => ({ name: t.name, badge_color: t.badge_color })),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('Affiliate directory error:', error)
    return NextResponse.json({ affiliates: [], total: 0 })
  }
}
