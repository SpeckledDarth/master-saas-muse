import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'
  
  const sanitizedNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const cookieStore = await cookies()
        const refCode = cookieStore.get('pp_ref')?.value
        if (refCode) {
          const admin = createAdminClient()
          const { data: existing } = await admin
            .from('affiliate_referrals')
            .select('id')
            .eq('referred_user_id', user.id)
            .maybeSingle()

          if (!existing) {
            const { data: affiliateLink } = await admin
              .from('referral_links')
              .select('id, user_id, is_affiliate, signups')
              .eq('ref_code', refCode)
              .eq('is_affiliate', true)
              .maybeSingle()

            if (affiliateLink && affiliateLink.user_id !== user.id) {
              await admin.from('affiliate_referrals').insert({
                affiliate_user_id: affiliateLink.user_id,
                referred_user_id: user.id,
                ref_code: refCode,
                ip_hash: '',
                status: 'signed_up',
                fraud_flags: [],
              })
              await admin.from('referral_links').update({
                signups: (affiliateLink.signups || 0) + 1,
                updated_at: new Date().toISOString(),
              }).eq('id', affiliateLink.id)
            }
          }
        }
      }
    } catch (err) {
      console.error('Referral attribution in callback:', err)
    }
  }

  return NextResponse.redirect(new URL(sanitizedNext, request.url))
}
