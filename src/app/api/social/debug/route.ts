import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isDebugMode, getMockTrends, getMockAlert, getMockEngagementData } from '@/lib/social/debug'
import { checkRateLimit } from '@/lib/rate-limit'

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(request: NextRequest) {
  if (!isDebugMode()) {
    return NextResponse.json(
      { error: 'Debug mode is not enabled. Set SOCIO_DEBUG_MODE=true to use this endpoint.' },
      { status: 403 }
    )
  }

  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimitResult = await checkRateLimit(user.id, {
    limit: 30,
    windowMs: 60 * 1000,
    identifier: `social:debug:${user.id}`,
  })
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'trends'
  const niche = searchParams.get('niche') || 'plumbing'
  const platform = searchParams.get('platform') || 'twitter'

  switch (type) {
    case 'trends': {
      const trends = getMockTrends(niche, platform)
      return NextResponse.json({ debug: true, type: 'trends', niche, platform, data: trends })
    }
    case 'alerts': {
      const alert = getMockAlert(user.id, platform)
      return NextResponse.json({ debug: true, type: 'alerts', platform, data: alert })
    }
    case 'posts': {
      const posts = getMockEngagementData()
      return NextResponse.json({ debug: true, type: 'posts', data: posts })
    }
    default:
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: trends, alerts, posts' },
        { status: 400 }
      )
  }
}
