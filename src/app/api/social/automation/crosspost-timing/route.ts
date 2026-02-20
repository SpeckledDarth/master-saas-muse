import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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

const PLATFORM_TIMINGS: Array<{
  platform: string
  delayHours: number
  delay: string
  reason: string
}> = [
  {
    platform: 'Own Blog',
    delayHours: 0,
    delay: 'Immediate',
    reason: 'Publish on your own blog first to establish canonical URL and SEO ownership.',
  },
  {
    platform: 'Ghost',
    delayHours: 6,
    delay: '6 hours',
    reason: 'Ghost supports canonical URLs. Publish early to capture newsletter subscribers.',
  },
  {
    platform: 'WordPress',
    delayHours: 12,
    delay: '12 hours',
    reason: 'WordPress cross-post with canonical link. Allows your blog to be indexed first.',
  },
  {
    platform: 'Medium',
    delayHours: 24,
    delay: '24 hours',
    reason: 'Medium has strong domain authority. Delay ensures your original gets indexed first by search engines.',
  },
  {
    platform: 'LinkedIn Articles',
    delayHours: 48,
    delay: '48 hours',
    reason: 'LinkedIn articles reach professional audiences. Stagger to avoid duplicate content signals.',
  },
  {
    platform: 'Substack',
    delayHours: 72,
    delay: '72 hours',
    reason: 'Substack sends email newsletters. Delay maximizes reach across different audience segments over time.',
  },
]

export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ timings: PLATFORM_TIMINGS })
}
