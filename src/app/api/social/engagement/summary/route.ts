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

const safeFetch = async (queryFn: () => PromiseLike<{ data: any; error: any }>) => {
  try {
    const r = await queryFn()
    if (r.error?.code === '42P01' || r.error?.message?.includes('does not exist')) return { data: [] }
    return { data: r.data || [] }
  } catch {
    return { data: [] }
  }
}

interface PostWithEngagement {
  id: string
  platform: string
  content: string
  engagement_data: Record<string, number> | null
  posted_at: string | null
  created_at: string
  platform_post_id: string | null
}

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdmin()

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()

    const [recentRes, monthRes] = await Promise.all([
      safeFetch(() =>
        admin.from('social_posts')
          .select('id, platform, content, engagement_data, posted_at, created_at, platform_post_id')
          .eq('user_id', user.id)
          .eq('status', 'posted')
          .not('platform_post_id', 'is', null)
          .gte('posted_at', sevenDaysAgo)
          .order('posted_at', { ascending: false })
          .limit(100)
      ),
      safeFetch(() =>
        admin.from('social_posts')
          .select('id, platform, content, engagement_data, posted_at, created_at, platform_post_id')
          .eq('user_id', user.id)
          .eq('status', 'posted')
          .not('platform_post_id', 'is', null)
          .gte('posted_at', thirtyDaysAgo)
          .order('posted_at', { ascending: false })
          .limit(500)
      ),
    ])

    const recentPosts: PostWithEngagement[] = recentRes.data
    const monthPosts: PostWithEngagement[] = monthRes.data

    const sumMetrics = (posts: PostWithEngagement[]) => {
      let likes = 0, comments = 0, shares = 0, impressions = 0
      for (const post of posts) {
        const eng = post.engagement_data || {}
        likes += eng.likes || eng.like_count || 0
        comments += eng.comments || eng.replies || eng.reply_count || eng.comment_count || 0
        shares += eng.shares || eng.retweets || eng.retweet_count || eng.share_count || 0
        impressions += eng.impressions || eng.impression_count || eng.reach || eng.views || 0
      }
      return { likes, comments, shares, impressions, totalEngagement: likes + comments + shares }
    }

    const weekMetrics = sumMetrics(recentPosts)
    const monthMetrics = sumMetrics(monthPosts)

    const platformBreakdown: Record<string, { posts: number; likes: number; comments: number; shares: number; impressions: number }> = {}
    for (const post of monthPosts) {
      if (!platformBreakdown[post.platform]) {
        platformBreakdown[post.platform] = { posts: 0, likes: 0, comments: 0, shares: 0, impressions: 0 }
      }
      const b = platformBreakdown[post.platform]
      b.posts++
      const eng = post.engagement_data || {}
      b.likes += eng.likes || eng.like_count || 0
      b.comments += eng.comments || eng.replies || eng.reply_count || eng.comment_count || 0
      b.shares += eng.shares || eng.retweets || eng.retweet_count || eng.share_count || 0
      b.impressions += eng.impressions || eng.impression_count || eng.reach || eng.views || 0
    }

    let topPost: { platform: string; content: string; engagement: number; postedAt: string } | null = null
    let topEng = -1
    for (const post of recentPosts) {
      const eng = post.engagement_data || {}
      const total = (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0) + (eng.replies || 0) + (eng.retweets || 0)
      if (total > topEng) {
        topEng = total
        topPost = {
          platform: post.platform,
          content: (post.content || '').slice(0, 200),
          engagement: total,
          postedAt: post.posted_at || post.created_at,
        }
      }
    }

    const dailyData: Record<string, { posts: number; engagement: number }> = {}
    for (const post of recentPosts) {
      const day = (post.posted_at || post.created_at).slice(0, 10)
      if (!dailyData[day]) dailyData[day] = { posts: 0, engagement: 0 }
      dailyData[day].posts++
      const eng = post.engagement_data || {}
      dailyData[day].engagement += (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0) + (eng.replies || 0) + (eng.retweets || 0)
    }

    const engagementRate = weekMetrics.impressions > 0
      ? ((weekMetrics.totalEngagement / weekMetrics.impressions) * 100).toFixed(2)
      : null

    return NextResponse.json({
      week: {
        ...weekMetrics,
        postCount: recentPosts.length,
        engagementRate,
      },
      month: {
        ...monthMetrics,
        postCount: monthPosts.length,
      },
      platformBreakdown,
      topPost,
      dailyTrend: Object.entries(dailyData)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    })
  } catch (err) {
    console.error('[Engagement Summary] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch engagement summary' }, { status: 500 })
  }
}
