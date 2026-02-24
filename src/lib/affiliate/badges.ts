import { createAdminClient } from '@/lib/supabase/admin'

export interface BadgeTier {
  id: string
  name: string
  threshold_cents: number
  badge_image_url: string | null
  embed_html: string | null
  sort_order: number
}

export interface AwardedBadge {
  id: string
  affiliate_user_id: string
  badge_type: string
  threshold_cents: number
  awarded_at: string
  verification_code: string
  is_active: boolean
}

const DEFAULT_BADGE_TIERS = [
  { name: 'Verified Partner', threshold_cents: 50000 },
  { name: 'Top Partner', threshold_cents: 250000 },
  { name: 'Elite Partner', threshold_cents: 1000000 },
]

export async function checkAndAwardBadges(affiliateUserId: string): Promise<AwardedBadge[]> {
  const admin = createAdminClient()
  const newlyAwarded: AwardedBadge[] = []

  try {
    const { data: link } = await admin
      .from('referral_links')
      .select('total_earnings_cents')
      .eq('user_id', affiliateUserId)
      .maybeSingle()

    if (!link) return newlyAwarded

    const totalEarnings = link.total_earnings_cents || 0

    let tiers: BadgeTier[] = []
    const { data: dbTiers, error: tiersErr } = await admin
      .from('affiliate_badge_tiers')
      .select('*')
      .order('sort_order', { ascending: true })

    if (tiersErr || !dbTiers || dbTiers.length === 0) {
      tiers = DEFAULT_BADGE_TIERS.map((t, i) => ({
        id: `default-${i}`,
        name: t.name,
        threshold_cents: t.threshold_cents,
        badge_image_url: null,
        embed_html: null,
        sort_order: i + 1,
      }))
    } else {
      tiers = dbTiers
    }

    const { data: existingBadges } = await admin
      .from('affiliate_badges')
      .select('*')
      .eq('affiliate_user_id', affiliateUserId)

    const existingTypes = new Set((existingBadges || []).map((b: any) => b.badge_type))

    for (const tier of tiers) {
      const badgeType = tier.name.toLowerCase().replace(/\s+/g, '_')

      if (totalEarnings >= tier.threshold_cents && !existingTypes.has(badgeType)) {
        const fullRow: Record<string, any> = {
          affiliate_user_id: affiliateUserId,
          badge_type: badgeType,
          threshold_cents: tier.threshold_cents,
          awarded_at: new Date().toISOString(),
          is_active: true,
        }

        const { data: badge, error } = await admin
          .from('affiliate_badges')
          .insert(fullRow)
          .select()
          .single()

        if (error) {
          if (error.code === '42703') {
            const minRow = {
              affiliate_user_id: affiliateUserId,
              badge_type: badgeType,
              threshold_cents: tier.threshold_cents,
            }
            const { data: minBadge } = await admin
              .from('affiliate_badges')
              .insert(minRow)
              .select()
              .single()
            if (minBadge) newlyAwarded.push(minBadge)
          } else {
            console.error('[Badges] Failed to award badge:', error.message)
          }
        } else if (badge) {
          newlyAwarded.push(badge)
        }

        try {
          await admin.from('notifications').insert({
            user_id: affiliateUserId,
            title: `Badge Earned: ${tier.name}!`,
            message: `Congratulations! You've earned the ${tier.name} badge for reaching $${(tier.threshold_cents / 100).toFixed(0)} in earnings.`,
            type: 'success',
            link: '/affiliate/dashboard?section=account',
          })
        } catch {}
      }
    }

    return newlyAwarded
  } catch (err) {
    console.error('[Badges] checkAndAwardBadges error:', err)
    return newlyAwarded
  }
}

export async function verifyBadge(code: string) {
  const admin = createAdminClient()

  try {
    const { data: badge, error } = await admin
      .from('affiliate_badges')
      .select('*')
      .eq('verification_code', code)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !badge) return null

    const { data: link } = await admin
      .from('referral_links')
      .select('user_id, ref_code')
      .eq('user_id', badge.affiliate_user_id)
      .maybeSingle()

    const { data: profile } = await admin
      .from('affiliate_profiles')
      .select('display_name')
      .eq('user_id', badge.affiliate_user_id)
      .maybeSingle()

    return {
      badge_type: badge.badge_type,
      threshold_cents: badge.threshold_cents,
      awarded_at: badge.awarded_at,
      affiliate_name: profile?.display_name || 'Affiliate Partner',
      is_valid: true,
    }
  } catch (err) {
    console.error('[Badges] verifyBadge error:', err)
    return null
  }
}
