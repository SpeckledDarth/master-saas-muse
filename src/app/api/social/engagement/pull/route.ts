import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} }
    }
  })
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdmin()

    const { data: accounts, error: accountsError } = await admin
      .from('social_accounts')
      .select('platform')
      .eq('user_id', user.id)
      .eq('is_valid', true)

    if (accountsError) {
      if (accountsError.code === '42P01') {
        return NextResponse.json({ enqueued: 0, message: 'Social accounts table not created yet' })
      }
      return NextResponse.json({ error: accountsError.message }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ enqueued: 0, message: 'No connected accounts to pull metrics from' })
    }

    const { addSocialEngagementPullJob } = await import('@/lib/queue/index')
    let enqueued = 0
    const platforms: string[] = []

    for (const account of accounts) {
      try {
        const jobId = await addSocialEngagementPullJob({
          userId: user.id,
          platform: account.platform,
          lookbackHours: 168,
        })
        if (jobId) {
          enqueued++
          platforms.push(account.platform)
        }
      } catch (err) {
        console.warn(`[Engagement Pull] Failed to enqueue for ${account.platform}:`, (err as Error).message)
      }
    }

    return NextResponse.json({
      enqueued,
      platforms,
      message: enqueued > 0
        ? `Pulling latest metrics from ${platforms.join(', ')}. Data will update in a few moments.`
        : 'No jobs were enqueued. Try again later.',
    })
  } catch (err) {
    console.error('[Engagement Pull] Error:', err)
    return NextResponse.json({ error: 'Failed to trigger engagement pull' }, { status: 500 })
  }
}
