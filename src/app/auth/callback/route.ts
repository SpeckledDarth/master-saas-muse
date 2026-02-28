import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as 'magiclink' | 'email' | 'signup' | 'invite' | 'recovery' | undefined
  const next = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirectTo') || '/'
  
  const sanitizedNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'
  
  const redirectUrl = new URL(sanitizedNext, request.url)
  const response = NextResponse.redirect(redirectUrl)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  let authenticated = false

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) {
      console.error('Auth callback verifyOtp error:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }
    authenticated = true
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Auth callback code exchange error:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }
    authenticated = true
  }

  if (authenticated) {
    const admin = createAdminClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const refCode = request.cookies.get('pp_ref')?.value
        if (refCode) {
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

        if (sanitizedNext === '/') {
          try {
            const [roleRes, memberRes, subRes] = await Promise.all([
              admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
              admin.from('organization_members').select('role').eq('user_id', user.id).limit(1).maybeSingle(),
              admin.from('subscriptions').select('status').eq('user_id', user.id).in('status', ['active', 'trialing']).limit(1).maybeSingle(),
            ])

            const role = roleRes.data?.role
            if (role === 'admin' || memberRes.data) {
              return NextResponse.redirect(new URL('/admin', request.url))
            }
            if (role === 'affiliate') {
              return NextResponse.redirect(new URL('/affiliate/dashboard', request.url))
            }
            if (subRes.data) {
              return NextResponse.redirect(new URL('/dashboard/social/overview', request.url))
            }
          } catch (roleErr) {
            console.error('Role-based redirect in callback:', roleErr)
          }
        }
      }
    } catch (err) {
      console.error('Referral attribution in callback:', err)
    }
  }

  return response
}
