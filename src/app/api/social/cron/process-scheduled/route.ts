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
    const now = new Date().toISOString()

    const { data: duePosts, error } = await admin
      .from('social_posts')
      .select('id, user_id, platform, content, media_urls, scheduled_at')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(50)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ processed: 0, note: 'Social posts table not created yet' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No scheduled posts due' })
    }

    const { addSocialPostJob } = await import('@/lib/queue/index')
    let enqueued = 0
    const errors: string[] = []

    for (const post of duePosts) {
      try {
        await admin
          .from('social_posts')
          .update({ status: 'posting', updated_at: new Date().toISOString() })
          .eq('id', post.id)
          .eq('status', 'scheduled')

        const jobId = await addSocialPostJob({
          postId: post.id,
          userId: post.user_id,
          platform: post.platform,
          content: post.content,
          mediaUrls: post.media_urls || [],
        })

        if (jobId) {
          enqueued++
          console.log(`[Cron] Enqueued post ${post.id} for ${post.platform} (job ${jobId})`)
        } else {
          await admin
            .from('social_posts')
            .update({ status: 'scheduled', updated_at: new Date().toISOString() })
            .eq('id', post.id)
          errors.push(`Post ${post.id}: Queue unavailable`)
        }
      } catch (err) {
        await admin
          .from('social_posts')
          .update({
            status: 'failed',
            error_message: (err as Error).message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id)
        errors.push(`Post ${post.id}: ${(err as Error).message}`)
      }
    }

    return NextResponse.json({
      processed: duePosts.length,
      enqueued,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('[Cron] Process scheduled posts failed:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
