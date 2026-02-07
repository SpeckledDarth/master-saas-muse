import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  try {
    const { data: orgSettings } = await admin
      .from('organization_settings')
      .select('settings')
      .eq('app_id', 'default')
      .single()

    const socialEnabled = (orgSettings?.settings as any)?.features?.socialModuleEnabled ?? false

    if (!socialEnabled) {
      return NextResponse.json({ message: 'Social module not enabled', processed: 0 })
    }

    let processedCount = 0

    try {
      const now = new Date().toISOString()
      const { data: scheduledPosts } = await admin
        .from('social_posts')
        .select('id, user_id, platform, content, media_urls, scheduled_at')
        .eq('status', 'scheduled')
        .lte('scheduled_at', now)
        .limit(10)

      if (scheduledPosts && scheduledPosts.length > 0) {
        const { addSocialPostJob } = await import('@/lib/queue/index')

        for (const post of scheduledPosts) {
          await admin
            .from('social_posts')
            .update({ status: 'posting' })
            .eq('id', post.id)

          const jobId = await addSocialPostJob({
            postId: post.id,
            userId: post.user_id,
            platform: post.platform,
            content: post.content,
            mediaUrls: post.media_urls || [],
          })

          if (jobId) {
            processedCount++
            console.log(`[Cron] Enqueued social post ${post.id} as job ${jobId}`)
          }
        }
      }
    } catch (err) {
      console.error('[Cron] Error processing scheduled posts:', (err as Error).message)
    }

    try {
      const statusCheckerEnabled = (orgSettings?.settings as any)?.socialModule?.statusChecker?.enabled ?? true
      const failureThreshold = (orgSettings?.settings as any)?.socialModule?.statusChecker?.failureThreshold ?? 3
      const alertEmail = (orgSettings?.settings as any)?.security?.alertRecipientEmail || ''

      if (statusCheckerEnabled) {
        const { addSocialHealthCheckJob } = await import('@/lib/queue/index')
        const platforms: ('twitter' | 'linkedin')[] = ['twitter', 'linkedin']

        const enabledPlatforms = platforms.filter(p => {
          return (orgSettings?.settings as any)?.socialModule?.platforms?.[p]?.enabled ?? false
        })

        if (enabledPlatforms.length > 0) {
          await addSocialHealthCheckJob({
            platforms: enabledPlatforms,
            alertEmail: alertEmail || undefined,
            failureThreshold,
          })
          console.log(`[Cron] Enqueued health check for: ${enabledPlatforms.join(', ')}`)
        }
      }
    } catch (err) {
      console.error('[Cron] Error enqueuing health check:', (err as Error).message)
    }

    return NextResponse.json({
      message: 'Cron completed',
      processed: processedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Social cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
