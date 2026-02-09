import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getUserSocialTier } from '@/lib/social/user-tier'
import { DEFAULT_TIER_LIMITS } from '@/lib/social/rate-limits'

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

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tier } = await getUserSocialTier(user.id)
    const limits = DEFAULT_TIER_LIMITS[tier]

    return NextResponse.json({ tier, limits })
  } catch (error) {
    console.error('Error fetching tier:', error)
    return NextResponse.json({ tier: 'starter', limits: DEFAULT_TIER_LIMITS.starter })
  }
}
