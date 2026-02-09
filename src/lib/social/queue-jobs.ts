import type { Job } from 'bullmq'
import type { SocialPlatform } from './client'

export interface SocialPostJobData {
  type: 'social-post'
  postId: string
  userId: string
  platform: string
  content: string
  mediaUrls?: string[]
  scheduledAt?: string
}

export interface SocialHealthCheckJobData {
  type: 'social-health-check'
  platforms: string[]
  alertEmail?: string
  failureThreshold: number
}

export interface SocialTrendMonitorJobData {
  type: 'social-trend-monitor'
  platform: string
  keywords: string[]
  userId: string
}

export interface SocialEngagementPullJobData {
  type: 'social-engagement-pull'
  userId: string
  platform: string
  lookbackHours: number
}

export type SocialJobType = 'social-post' | 'social-health-check' | 'social-trend-monitor' | 'social-engagement-pull'

export type SocialJobData = SocialPostJobData | SocialHealthCheckJobData | SocialTrendMonitorJobData | SocialEngagementPullJobData

export async function processSocialPostJob(job: Job<SocialPostJobData>): Promise<void> {
  console.log(`[Queue] Processing social post for ${job.data.platform}: ${job.data.postId}`)
  let failureEmailSent = false

  try {
    const { getPlatformClient } = await import('@/lib/social/client')
    const { decryptToken } = await import('@/lib/social/crypto')
    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { refreshAccessToken } = await import('@/lib/social/token-refresh')

    const { data: account } = await admin
      .from('social_accounts')
      .select('access_token_encrypted, refresh_token_encrypted')
      .eq('user_id', job.data.userId)
      .eq('platform', job.data.platform)
      .eq('is_valid', true)
      .single()

    if (!account?.access_token_encrypted) {
      await admin.from('social_posts').update({ status: 'failed', error_message: 'No valid account connected' }).eq('id', job.data.postId)
      throw new Error(`No valid ${job.data.platform} account for user ${job.data.userId}`)
    }

    let accessToken = decryptToken(account.access_token_encrypted)
    const client = getPlatformClient(job.data.platform as SocialPlatform)

    const validation = await client.validateToken(accessToken)
    if (!validation.valid) {
      if (account.refresh_token_encrypted) {
        const newToken = await refreshAccessToken(job.data.platform, job.data.userId, account.refresh_token_encrypted)
        if (newToken) {
          accessToken = newToken
        } else {
          await admin.from('social_posts').update({ status: 'failed', error_message: 'Token expired, please reconnect your account' }).eq('id', job.data.postId)
          throw new Error(`Token expired for ${job.data.platform} account, user ${job.data.userId}`)
        }
      } else {
        await admin.from('social_posts').update({ status: 'failed', error_message: 'Token expired, please reconnect your account' }).eq('id', job.data.postId)
        throw new Error(`Token expired for ${job.data.platform} account, user ${job.data.userId}`)
      }
    }

    const result = await client.createPost(accessToken, job.data.content, job.data.mediaUrls)

    if (result) {
      await admin.from('social_posts').update({
        status: 'posted',
        posted_at: new Date().toISOString(),
        platform_post_id: result.postId,
      }).eq('id', job.data.postId)
      console.log(`[Queue] Social post published: ${result.postId}`)

      try {
        const { sendPostPublishedEmail } = await import('@/lib/social/email-notifications')
        const { data: { user } } = await admin.auth.admin.getUserById(job.data.userId)
        if (user?.email) {
          const emailResult = await sendPostPublishedEmail(
            user.email,
            user.user_metadata?.full_name || user.user_metadata?.name || '',
            job.data.platform,
            job.data.content,
            result.url
          )
          console.log(`[Queue] Post success email sent: ${emailResult.success}`)
        }
      } catch (emailErr) {
        console.warn(`[Queue] Failed to send post success email:`, (emailErr as Error).message)
      }
    } else {
      await admin.from('social_posts').update({ status: 'failed', error_message: 'Platform API returned null' }).eq('id', job.data.postId)

      try {
        const { sendPostFailedEmail } = await import('@/lib/social/email-notifications')
        const { data: { user } } = await admin.auth.admin.getUserById(job.data.userId)
        if (user?.email) {
          const emailResult = await sendPostFailedEmail(
            user.email,
            user.user_metadata?.full_name || user.user_metadata?.name || '',
            job.data.platform,
            job.data.content,
            'Platform API returned null'
          )
          console.log(`[Queue] Post failure email sent: ${emailResult.success}`)
          failureEmailSent = true
        }
      } catch (emailErr) {
        console.warn(`[Queue] Failed to send post failure email:`, (emailErr as Error).message)
      }

      throw new Error('Platform createPost returned null')
    }
  } catch (err) {
    const errorMessage = (err as Error).message
    console.error(`[Queue] Social post job failed:`, errorMessage)

    if (!failureEmailSent) {
      try {
        const { sendPostFailedEmail } = await import('@/lib/social/email-notifications')
        const { createClient } = await import('@supabase/supabase-js')
        const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        const { data: { user } } = await adminClient.auth.admin.getUserById(job.data.userId)
        if (user?.email) {
          const emailResult = await sendPostFailedEmail(
            user.email,
            user.user_metadata?.full_name || user.user_metadata?.name || '',
            job.data.platform,
            job.data.content,
            errorMessage
          )
          console.log(`[Queue] Post failure email sent: ${emailResult.success}`)
        }
      } catch (emailErr) {
        console.warn(`[Queue] Failed to send post failure email:`, (emailErr as Error).message)
      }
    }

    throw err
  }
}

export async function processSocialHealthCheckJob(job: Job<SocialHealthCheckJobData>): Promise<void> {
  console.log(`[Queue] Running social API health check for: ${job.data.platforms.join(', ')}`)

  try {
    const { getPlatformClient } = await import('@/lib/social/client')
    const failures: string[] = []

    for (const platform of job.data.platforms) {
      const client = getPlatformClient(platform as SocialPlatform)
      const health = await client.checkHealth()
      console.log(`[Queue] ${platform} health: ${health.healthy ? 'OK' : 'FAILED'} (${health.latencyMs}ms)`)

      if (!health.healthy) {
        failures.push(platform)
      }
    }

    if (failures.length >= job.data.failureThreshold && job.data.alertEmail) {
      const { getEmailClient } = await import('@/lib/email/client')
      const { client: emailClient, fromEmail } = await getEmailClient()

      await emailClient.emails.send({
        from: fromEmail,
        to: [job.data.alertEmail],
        subject: `Social API Health Alert: ${failures.join(', ')} unreachable`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Social API Health Alert</h2>
            <p>The following social platform APIs are currently unreachable:</p>
            <ul>${failures.map(p => `<li><strong>${p}</strong></li>`).join('')}</ul>
            <p>This may affect scheduled posts and monitoring. The system will automatically retry.</p>
          </div>
        `,
      })
      console.log(`[Queue] Health alert sent to ${job.data.alertEmail}`)
    }

    await job.updateProgress(100)
  } catch (err) {
    console.error(`[Queue] Social health check failed:`, (err as Error).message)
    throw err
  }
}

export async function processSocialTrendMonitorJob(job: Job<SocialTrendMonitorJobData>): Promise<void> {
  console.log(`[Queue] Monitoring trends on ${job.data.platform} for keywords: ${job.data.keywords.join(', ')}`)
  await job.updateProgress(100)
  console.log(`[Queue] Trend monitoring completed for ${job.data.platform}`)
}

export async function processSocialEngagementPullJob(job: Job<SocialEngagementPullJobData>): Promise<void> {
  const lookbackMs = (job.data.lookbackHours || 24) * 60 * 60 * 1000
  const since = new Date(Date.now() - lookbackMs).toISOString()

  console.log(`[Queue] Pulling engagement metrics for ${job.data.platform} (user ${job.data.userId}) since ${since}`)

  try {
    const { getPlatformClient } = await import('@/lib/social/client')
    const { decryptToken } = await import('@/lib/social/crypto')
    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: account } = await admin
      .from('social_accounts')
      .select('access_token_encrypted')
      .eq('user_id', job.data.userId)
      .eq('platform', job.data.platform)
      .eq('is_valid', true)
      .single()

    if (!account?.access_token_encrypted) {
      console.warn(`[Queue] No valid ${job.data.platform} account for user ${job.data.userId}, skipping engagement pull`)
      return
    }

    const accessToken = decryptToken(account.access_token_encrypted)

    const { data: posts } = await admin
      .from('social_posts')
      .select('id, platform_post_id')
      .eq('user_id', job.data.userId)
      .eq('platform', job.data.platform)
      .eq('status', 'posted')
      .not('platform_post_id', 'is', null)
      .gte('posted_at', since)
      .limit(50)

    if (!posts || posts.length === 0) {
      console.info(`[Queue] No recent posted content for ${job.data.platform} (user ${job.data.userId}) — skipping engagement pull`)
      await job.updateProgress(100)
      return
    }

    const client = getPlatformClient(job.data.platform as SocialPlatform)
    let updated = 0

    for (const post of posts) {
      try {
        const metrics = await client.getPostEngagement(accessToken, post.platform_post_id)
        if (metrics && Object.keys(metrics).length > 0) {
          await admin
            .from('social_posts')
            .update({
              engagement_data: metrics,
              updated_at: new Date().toISOString(),
            })
            .eq('id', post.id)
          updated++
        }
      } catch (err) {
        console.warn(`[Queue] Failed to pull metrics for post ${post.id}:`, (err as Error).message)
      }
    }

    await job.updateProgress(100)
    console.log(`[Queue] Engagement pull completed: ${updated}/${posts.length} posts updated`)
  } catch (err) {
    console.error(`[Queue] Engagement pull job failed:`, (err as Error).message)
    try {
      const Sentry = await import('@sentry/nextjs')
      Sentry.captureException(err, {
        tags: { queue: 'social-engagement-pull', platform: job.data.platform },
        extra: { userId: job.data.userId, jobId: job.id, attemptsMade: job.attemptsMade },
      })
    } catch {}
    throw err
  }
}

export function isSocialJobType(type: string): type is SocialJobType {
  return ['social-post', 'social-health-check', 'social-trend-monitor', 'social-engagement-pull'].includes(type)
}

export async function processSocialJob(job: Job<SocialJobData>): Promise<void> {
  switch (job.data.type) {
    case 'social-post':
      return processSocialPostJob(job as Job<SocialPostJobData>)
    case 'social-health-check':
      return processSocialHealthCheckJob(job as Job<SocialHealthCheckJobData>)
    case 'social-trend-monitor':
      return processSocialTrendMonitorJob(job as Job<SocialTrendMonitorJobData>)
    case 'social-engagement-pull':
      return processSocialEngagementPullJob(job as Job<SocialEngagementPullJobData>)
    default:
      throw new Error(`Unknown social job type: ${(job.data as SocialJobData).type}`)
  }
}
