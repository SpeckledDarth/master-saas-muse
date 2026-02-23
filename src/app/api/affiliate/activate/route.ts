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
      const { sendEmail } = await import('@/lib/email')
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'there'
      const dashboardUrl = `${baseUrl}/affiliate/dashboard`

      await sendEmail({
        to: user.email!,
        subject: 'Welcome to our Affiliate Program!',
        html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">Welcome aboard, ${name}!</h1>
          <p>You're now part of our affiliate program. Here's your dashboard where you can track everything.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Dashboard</a>
          </div>
        </div>`,
      })

      try {
        await admin.from('email_drip_log').insert({
          user_id: user.id,
          sequence_name: 'affiliate',
          step: 1,
          email_key: 'welcome',
        })
      } catch {}
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
