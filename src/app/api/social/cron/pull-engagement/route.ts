import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') return false
    return true
  }
  return authHeader === `Bearer ${cronSecret}`
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = getSupabaseAdmin()

    const { data: accounts, error } = await admin
      .from('social_accounts')
      .select('user_id, platform')
      .eq('is_valid', true)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ processed: 0, note: 'Social accounts table not created yet' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No valid accounts to pull engagement for' })
    }

    const { addSocialEngagementPullJob } = await import('@/lib/queue/index')
    let enqueued = 0

    const seen = new Set<string>()

    for (const account of accounts) {
      const key = `${account.user_id}:${account.platform}`
      if (seen.has(key)) continue
      seen.add(key)

      try {
        const jobId = await addSocialEngagementPullJob({
          userId: account.user_id,
          platform: account.platform,
          lookbackHours: 48,
        })

        if (jobId) {
          enqueued++
        }
      } catch (err) {
        console.warn(`[Cron] Failed to enqueue engagement pull for ${key}:`, (err as Error).message)
      }
    }

    return NextResponse.json({
      processed: accounts.length,
      enqueued,
    })
  } catch (err) {
    console.error('[Cron] Pull engagement failed:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
