import { createAdminClient } from '@/lib/supabase/admin'

export interface AffiliateSettings {
  id: string
  commission_rate: number
  commission_duration_months: number
  min_payout_cents: number
  cookie_duration_days: number
  program_active: boolean
  updated_at: string
}

export interface AffiliateTier {
  id: string
  name: string
  min_referrals: number
  commission_rate: number
  sort_order: number
}

export interface AffiliateLink {
  id: string
  user_id: string
  ref_code: string
  clicks: number
  signups: number
  is_affiliate: boolean
  locked_commission_rate: number | null
  locked_duration_months: number | null
  locked_at: string | null
  current_tier_id: string | null
  total_earnings_cents: number
  paid_earnings_cents: number
  pending_earnings_cents: number
  created_at: string
  updated_at: string
}

export interface AffiliateReferral {
  id: string
  affiliate_user_id: string
  referred_user_id: string
  ref_code: string
  ip_hash: string | null
  status: 'signed_up' | 'converted' | 'churned'
  fraud_flags: string[]
  converted_at: string | null
  created_at: string
}

export interface AffiliateCommission {
  id: string
  affiliate_user_id: string
  referral_id: string
  stripe_invoice_id: string
  invoice_amount_cents: number
  commission_rate: number
  commission_amount_cents: number
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  created_at: string
}

export interface AffiliatePayout {
  id: string
  affiliate_user_id: string
  amount_cents: number
  method: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  notes: string | null
  processed_at: string | null
  processed_by: string | null
  created_at: string
}

export interface AffiliateAsset {
  id: string
  title: string
  description: string | null
  asset_type: 'banner' | 'email_template' | 'social_post' | 'text_snippet'
  content: string | null
  file_url: string | null
  file_name: string | null
  sort_order: number
  active: boolean
  created_at: string
}

export async function getAffiliateSettings(): Promise<AffiliateSettings | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('affiliate_program_settings')
    .select('*')
    .limit(1)
    .maybeSingle()
  return data
}

export async function getAffiliateTiers(): Promise<AffiliateTier[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('affiliate_tiers')
    .select('*')
    .order('sort_order', { ascending: true })
  return data || []
}

export async function getAffiliateLink(userId: string): Promise<AffiliateLink | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('referral_links')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function lockInAffiliateTerms(userId: string): Promise<void> {
  const admin = createAdminClient()

  const link = await getAffiliateLink(userId)
  if (!link) return
  if (link.locked_at) return

  const settings = await getAffiliateSettings()
  if (!settings) return

  await admin
    .from('referral_links')
    .update({
      is_affiliate: true,
      locked_commission_rate: settings.commission_rate,
      locked_duration_months: settings.commission_duration_months,
      locked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
}

export function getCommissionRate(link: AffiliateLink, tiers: AffiliateTier[]): number {
  if (link.locked_commission_rate != null) {
    const applicableTier = tiers
      .filter(t => link.signups >= t.min_referrals)
      .sort((a, b) => b.min_referrals - a.min_referrals)[0]

    if (applicableTier && applicableTier.commission_rate > link.locked_commission_rate) {
      return applicableTier.commission_rate
    }
    return link.locked_commission_rate
  }

  return 20
}

export function getCurrentTier(referralCount: number, tiers: AffiliateTier[]): AffiliateTier | null {
  const sorted = [...tiers].sort((a, b) => b.min_referrals - a.min_referrals)
  return sorted.find(t => referralCount >= t.min_referrals) || null
}

export function getNextTier(referralCount: number, tiers: AffiliateTier[]): AffiliateTier | null {
  const sorted = [...tiers].sort((a, b) => a.min_referrals - b.min_referrals)
  return sorted.find(t => referralCount < t.min_referrals) || null
}

export async function createNotification(userId: string, title: string, message: string, type: string = 'info', link?: string) {
  try {
    const admin = createAdminClient()
    await admin
      .from('notifications')
      .insert({ user_id: userId, title, message, type, link })
  } catch (err) {
    console.error('Failed to create notification:', err)
  }
}

export async function checkFraudFlags(
  affiliateUserId: string,
  referredEmail: string,
  ipHash: string | null
): Promise<string[]> {
  const flags: string[] = []
  const admin = createAdminClient()

  const { data: affiliateUser } = await admin.auth.admin.getUserById(affiliateUserId)
  if (affiliateUser?.user?.email) {
    const affiliateDomain = affiliateUser.user.email.split('@')[1]
    const referredDomain = referredEmail.split('@')[1]
    if (affiliateDomain && referredDomain && affiliateDomain === referredDomain) {
      flags.push('same_email_domain')
    }
  }

  if (ipHash) {
    const { data: recentFromIp } = await admin
      .from('affiliate_referrals')
      .select('id')
      .eq('affiliate_user_id', affiliateUserId)
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())

    if (recentFromIp && recentFromIp.length >= 3) {
      flags.push('suspicious_ip_volume')
    }
  }

  const { data: selfRef } = await admin
    .from('referral_links')
    .select('user_id')
    .eq('user_id', affiliateUserId)
    .maybeSingle()

  if (selfRef) {
    const { data: referredProfile } = await admin.auth.admin.listUsers()
    const referredUser = referredProfile?.users?.find(u => u.email === referredEmail)
    if (referredUser && referredUser.id === affiliateUserId) {
      flags.push('self_referral')
    }
  }

  return flags
}
