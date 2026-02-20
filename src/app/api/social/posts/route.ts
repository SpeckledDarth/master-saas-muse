import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { addSocialPostJob } from '@/lib/queue'
import { checkSocialRateLimit, getLimitsForTier } from '@/lib/social/rate-limits'
import { getUserSocialTier } from '@/lib/social/user-tier'
import type { TierLimits } from '@/lib/social/types'

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

async function getModuleConfig(): Promise<{ enabled: boolean; tier: string; configuredTierLimits?: Record<string, TierLimits> }> {
  const admin = getSupabaseAdmin()
  const { data } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
  const settings = (data?.settings || {}) as any
  return {
    enabled: settings.features?.socialModuleEnabled ?? false,
    tier: settings.socialModule?.tier || 'tier_1',
    configuredTierLimits: settings.socialModule?.tierLimits,
  }
}

const VALID_PLATFORMS = ['twitter', 'linkedin', 'instagram', 'facebook'] as const

export async function GET(request: NextRequest) {
  let user
  try {
    user = await getAuthenticatedUser()
  } catch {
    return NextResponse.json({ error: 'Auth error' }, { status: 401 })
  }
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let enabled = false
  try {
    const config = await getModuleConfig()
    enabled = config.enabled
  } catch {}
  if (!enabled) {
    return NextResponse.json({ error: 'Social module is not enabled' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const platformFilter = searchParams.get('platform')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200)

  try {
    const admin = getSupabaseAdmin()
    let query = admin
      .from('social_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    if (platformFilter) {
      query = query.eq('platform', platformFilter)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          posts: [],
          note: 'Social posts table has not been created yet. Please run the migration in src/lib/social/posts.sql'
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts: data || [] })
  } catch (err) {
    return NextResponse.json({
      posts: [],
      note: 'Could not query social posts. The table may not exist yet.'
    })
  }
}

export async function POST(request: NextRequest) {
  let user
  try {
    user = await getAuthenticatedUser()
  } catch {
    return NextResponse.json({ error: 'Auth error' }, { status: 401 })
  }
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let moduleConfig: { enabled: boolean; tier: string; configuredTierLimits?: Record<string, any> } = { enabled: false, tier: 'tier_1' }
  try {
    moduleConfig = await getModuleConfig()
  } catch {}
  if (!moduleConfig.enabled) {
    return NextResponse.json({ error: 'Social module is not enabled' }, { status: 403 })
  }

  const { configuredTierLimits } = moduleConfig
  const { tier } = await getUserSocialTier(user.id, moduleConfig.tier)
  const limits = getLimitsForTier(tier, configuredTierLimits)
  const rateLimitResult = await checkSocialRateLimit(user.id, 'post', tier, configuredTierLimits)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: `Post creation limit reached for ${tier} tier (${limits.dailyPosts} per day). Upgrade your tier or try again later.`,
        tier,
        limit: limits.dailyPosts,
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limits.dailyPosts.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  let body: { platform?: string; content?: string; scheduledAt?: string; mediaUrls?: string[]; source_blog_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { platform, content, scheduledAt, mediaUrls, source_blog_id } = body

  if (!platform || !VALID_PLATFORMS.includes(platform as typeof VALID_PLATFORMS[number])) {
    return NextResponse.json({ error: 'Invalid platform. Must be one of: twitter, linkedin, instagram' }, { status: 400 })
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const status = scheduledAt ? 'scheduled' : 'draft'

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('social_posts')
      .insert({
        user_id: user.id,
        platform,
        content: content.trim(),
        status,
        scheduled_at: scheduledAt || null,
        media_urls: mediaUrls || [],
        ai_generated: false,
        created_at: new Date().toISOString(),
        ...(source_blog_id ? { source_blog_id } : {}),
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Social posts table has not been created yet. Please run the migration in src/lib/social/posts.sql'
        }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (scheduledAt && data) {
      try {
        await addSocialPostJob({
          postId: data.id,
          userId: user.id,
          platform: platform as 'twitter' | 'linkedin' | 'instagram',
          content: content.trim(),
          mediaUrls,
          scheduledAt,
        })
      } catch (queueErr) {
        console.warn('[Social Posts] Could not enqueue post job:', (queueErr as Error).message)
      }
    }

    return NextResponse.json({ post: data })
  } catch (err) {
    return NextResponse.json({
      error: 'Could not create social post. The table may not exist yet. Please run the migration in src/lib/social/posts.sql'
    }, { status: 500 })
  }
}
