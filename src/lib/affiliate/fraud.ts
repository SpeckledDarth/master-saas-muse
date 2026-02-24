import { createAdminClient } from '@/lib/supabase/admin'

export interface FraudSignal {
  signal: string
  label: string
  points: number
}

export interface FraudScoreResult {
  score: number
  signals: FraudSignal[]
  autoPaused: boolean
}

const SIGNAL_POINTS = {
  same_ip_cluster: { points: 20, label: 'Same IP cluster — multiple signups from one IP' },
  rapid_signups_no_conversions: { points: 15, label: 'Rapid signups with no conversions' },
  self_referral: { points: 30, label: 'Self-referral detected' },
  same_email_domain: { points: 10, label: 'Referred users share affiliate email domain' },
  quick_cancels: { points: 25, label: 'High rate of quick cancellations' },
  geo_mismatch: { points: 5, label: 'Geographic mismatch between clicks and signups' },
}

export async function calculateFraudScore(affiliateUserId: string): Promise<FraudScoreResult> {
  const admin = createAdminClient()
  const signals: FraudSignal[] = []

  try {
    const { data: link } = await admin
      .from('referral_links')
      .select('ref_code, user_id, clicks, signups')
      .eq('user_id', affiliateUserId)
      .maybeSingle()

    if (!link) {
      return { score: 0, signals: [], autoPaused: false }
    }

    const { data: affiliateUser } = await admin.auth.admin.getUserById(affiliateUserId)
    const affiliateEmail = affiliateUser?.user?.email || ''
    const affiliateDomain = affiliateEmail.split('@')[1]?.toLowerCase() || ''

    const { data: referrals } = await admin
      .from('affiliate_referrals')
      .select('referred_user_id, created_at, ip_address, fraud_flags')
      .eq('affiliate_user_id', affiliateUserId)
      .order('created_at', { ascending: false })
      .limit(100)

    const refs = referrals || []

    if (refs.some((r: any) => r.referred_user_id === affiliateUserId)) {
      signals.push({ signal: 'self_referral', ...SIGNAL_POINTS.self_referral })
    }

    if (affiliateDomain && affiliateDomain !== 'gmail.com' && affiliateDomain !== 'yahoo.com' && affiliateDomain !== 'outlook.com' && affiliateDomain !== 'hotmail.com') {
      const referredUserIds = refs.map((r: any) => r.referred_user_id).filter(Boolean)
      if (referredUserIds.length > 0) {
        let samedomainCount = 0
        for (const refUserId of referredUserIds.slice(0, 20)) {
          try {
            const { data: refUser } = await admin.auth.admin.getUserById(refUserId)
            const refDomain = refUser?.user?.email?.split('@')[1]?.toLowerCase() || ''
            if (refDomain === affiliateDomain) samedomainCount++
          } catch {}
        }
        if (samedomainCount >= 2) {
          signals.push({ signal: 'same_email_domain', ...SIGNAL_POINTS.same_email_domain })
        }
      }
    }

    const ipCounts: Record<string, number> = {}
    for (const r of refs) {
      const ip = (r as any).ip_address
      if (ip) {
        ipCounts[ip] = (ipCounts[ip] || 0) + 1
      }
    }
    const maxIpCount = Math.max(0, ...Object.values(ipCounts))
    if (maxIpCount >= 5) {
      signals.push({ signal: 'same_ip_cluster', ...SIGNAL_POINTS.same_ip_cluster })
    }

    if (refs.length >= 5) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const recentRefs = refs.filter((r: any) => r.created_at >= thirtyDaysAgo)
      if (recentRefs.length >= 5) {
        const { data: commissions } = await admin
          .from('affiliate_commissions')
          .select('id')
          .eq('affiliate_user_id', affiliateUserId)
          .limit(1)

        if (!commissions || commissions.length === 0) {
          signals.push({ signal: 'rapid_signups_no_conversions', ...SIGNAL_POINTS.rapid_signups_no_conversions })
        }
      }
    }

    const { data: commissions } = await admin
      .from('affiliate_commissions')
      .select('id, status, created_at')
      .eq('affiliate_user_id', affiliateUserId)
      .eq('status', 'reversed')

    if (commissions && commissions.length >= 3) {
      signals.push({ signal: 'quick_cancels', ...SIGNAL_POINTS.quick_cancels })
    }

    const score = signals.reduce((sum, s) => sum + s.points, 0)

    try {
      await admin
        .from('referral_links')
        .update({
          fraud_score: score,
          fraud_score_updated_at: new Date().toISOString(),
        })
        .eq('user_id', affiliateUserId)
    } catch {}

    let autoPaused = false
    const { data: programSettings } = await admin
      .from('affiliate_program_settings')
      .select('fraud_auto_pause_threshold, fraud_scoring_enabled')
      .limit(1)
      .maybeSingle()

    const threshold = programSettings?.fraud_auto_pause_threshold ?? 60
    const enabled = programSettings?.fraud_scoring_enabled ?? false

    if (enabled && score >= threshold) {
      try {
        const { data: currentLink } = await admin
          .from('referral_links')
          .select('suspended')
          .eq('user_id', affiliateUserId)
          .maybeSingle()

        if (currentLink && !currentLink.suspended) {
          await admin
            .from('referral_links')
            .update({
              suspended: true,
              suspension_reason: `Auto-paused: fraud score ${score} exceeds threshold ${threshold}`,
            })
            .eq('user_id', affiliateUserId)

          autoPaused = true

          try {
            const { data: admins } = await admin
              .from('user_roles')
              .select('user_id')
              .eq('role', 'admin')
              .limit(5)

            if (admins?.length) {
              for (const a of admins) {
                await admin.from('notifications').insert({
                  user_id: a.user_id,
                  title: 'Affiliate Auto-Paused (Fraud)',
                  message: `Affiliate ${affiliateEmail} (score: ${score}) was auto-paused for exceeding the fraud threshold of ${threshold}.`,
                  type: 'warning',
                  link: '/admin/setup/affiliate?tab=affiliates',
                })
              }
            }
          } catch {}
        }
      } catch {}
    }

    return { score, signals, autoPaused }
  } catch (err) {
    console.error('[Fraud] Error calculating fraud score:', err)
    return { score: 0, signals: [], autoPaused: false }
  }
}
