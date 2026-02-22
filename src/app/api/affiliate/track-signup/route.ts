import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkFraudFlags, createNotification, lockInAffiliateTerms } from '@/lib/affiliate'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const refCode = body.ref_code

    if (!refCode) {
      return NextResponse.json({ error: 'No referral code provided' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: affiliateLink } = await admin
      .from('referral_links')
      .select('*')
      .eq('ref_code', refCode)
      .maybeSingle()

    if (!affiliateLink) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    }

    if (!affiliateLink.is_affiliate) {
      return NextResponse.json({ error: 'Referral code is not an active affiliate link' }, { status: 400 })
    }

    if (affiliateLink.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })
    }

    const { data: existing } = await admin
      .from('affiliate_referrals')
      .select('id')
      .eq('referred_user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ already_tracked: true })
    }

    const ipHash = crypto.createHash('sha256')
      .update(request.headers.get('x-forwarded-for') || 'unknown')
      .digest('hex')
      .substring(0, 16)

    const fraudFlags = await checkFraudFlags(
      affiliateLink.user_id,
      user.email || '',
      ipHash
    )

    const { error } = await admin
      .from('affiliate_referrals')
      .insert({
        affiliate_user_id: affiliateLink.user_id,
        referred_user_id: user.id,
        ref_code: refCode,
        ip_hash: ipHash,
        status: 'signed_up',
        fraud_flags: fraudFlags,
      })

    if (error) {
      console.error('Failed to track referral:', error)
      return NextResponse.json({ error: 'Failed to track referral' }, { status: 500 })
    }

    await admin
      .from('referral_links')
      .update({
        signups: (affiliateLink.signups || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', affiliateLink.id)

    if (!affiliateLink.locked_at) {
      await lockInAffiliateTerms(affiliateLink.user_id)
    }

    await createNotification(
      affiliateLink.user_id,
      'New Referral Signup!',
      'Someone signed up through your referral link.',
      'success',
      '/dashboard/social/affiliate'
    )

    return NextResponse.json({ tracked: true, fraud_flags: fraudFlags })
  } catch (err) {
    console.error('Affiliate track-signup error:', err)
    return NextResponse.json({ error: 'Failed to track signup' }, { status: 500 })
  }
}
