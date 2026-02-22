import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { lockInAffiliateTerms } from '@/lib/affiliate'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    let { data: link } = await admin
      .from('referral_links')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!link) {
      const crypto = await import('crypto')
      const hash = crypto.createHash('sha256').update(user.id + Date.now().toString()).digest('hex')
      const refCode = hash.substring(0, 8).toUpperCase()

      const { data: newLink, error } = await admin
        .from('referral_links')
        .insert({ user_id: user.id, ref_code: refCode, is_affiliate: true })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      link = newLink
    }

    if (!link.is_affiliate) {
      await admin
        .from('referral_links')
        .update({ is_affiliate: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
    }

    await lockInAffiliateTerms(user.id)

    const { data: updatedLink } = await admin
      .from('referral_links')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://passivepost.io'

    try {
      await fetch(`${baseUrl}/api/affiliate/drip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.SESSION_SECRET || '',
        },
        body: JSON.stringify({ userId: user.id }),
      })
    } catch {}

    return NextResponse.json({
      success: true,
      link: updatedLink ? { ...updatedLink, shareUrl: `${baseUrl}?ref=${updatedLink.ref_code}` } : null,
    })
  } catch (err) {
    console.error('Affiliate activate error:', err)
    return NextResponse.json({ error: 'Failed to activate affiliate account' }, { status: 500 })
  }
}
