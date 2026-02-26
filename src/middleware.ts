import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const protectedPaths = ['/profile', '/dashboard', '/admin', '/billing', '/settings']
  const affiliateProtectedPaths = ['/affiliate/dashboard', '/affiliate/set-password']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  const isAffiliateProtectedPath = affiliateProtectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (!isProtectedPath && !isAffiliateProtectedPath) {
    return response
  }

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

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (isAffiliateProtectedPath) {
      return NextResponse.redirect(new URL('/affiliate/login', request.url))
    }
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  const pathname = request.nextUrl.pathname
  const needsRoleCheck = pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || isAffiliateProtectedPath

  if (needsRoleCheck) {
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [roleResult, affiliateResult] = await Promise.all([
      adminDb.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
      adminDb.from('affiliate_profiles').select('user_id').eq('user_id', user.id).maybeSingle(),
    ])

    const userRole = roleResult.data?.role || 'user'
    const isAffiliate = userRole === 'affiliate' || !!affiliateResult.data
    const isAdmin = userRole === 'admin'

    if (pathname.startsWith('/admin')) {
      if (isAdmin) return response

      const { data: memberData } = await adminDb
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', 1)
        .order('joined_at', { ascending: false })
        .limit(1)

      const teamRole = memberData?.[0]?.role
      const hasTeamAccess = teamRole === 'owner' || teamRole === 'manager' || teamRole === 'member'

      if (!hasTeamAccess) {
        if (isAffiliate) {
          return NextResponse.redirect(new URL('/affiliate/dashboard', request.url))
        }
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    if (pathname.startsWith('/dashboard')) {
      if (isAffiliate && !isAdmin) {
        return NextResponse.redirect(new URL('/affiliate/dashboard', request.url))
      }
    }

    if (isAffiliateProtectedPath) {
      if (isAdmin) return response
      if (!isAffiliate) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
