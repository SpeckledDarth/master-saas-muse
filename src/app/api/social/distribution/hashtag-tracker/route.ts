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

function getEngagementScore(data: any): number {
  if (!data || typeof data !== 'object') return 0
  const likes = Number(data.likes || data.like_count || 0)
  const comments = Number(data.comments || data.comment_count || 0)
  const shares = Number(data.shares || data.share_count || data.retweets || data.reposts || 0)
  return likes + comments * 2 + shares * 3
}

export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  const safeFetch = async (queryFn: () => PromiseLike<{ data: any; error: any }>) => {
    try {
      const r = await queryFn()
      if (r.error?.code === '42P01' || r.error?.message?.includes('does not exist')) return { data: [] }
      return { data: r.data || [] }
    } catch {
      return { data: [] }
    }
  }

  const postsRes = await safeFetch(() =>
    admin.from('social_posts')
      .select('id, content, engagement_data, posted_at, created_at, status')
      .eq('user_id', user.id)
      .eq('status', 'posted')
      .order('created_at', { ascending: true })
  )

  const posts: any[] = postsRes.data as any[]

  const hashtagMap: Record<string, { totalEngagement: number; count: number; recentEngagements: number[]; olderEngagements: number[] }> = {}
  const midIndex = Math.floor(posts.length / 2)

  posts.forEach((post, index) => {
    const content = post.content || ''
    const tags = content.match(/#\w+/g)
    if (!tags) return

    const engagement = getEngagementScore(post.engagement_data)
    const uniqueTags = Array.from(new Set(tags.map((t: string) => t.toLowerCase()))) as string[]

    for (const tag of uniqueTags) {
      if (!hashtagMap[tag]) {
        hashtagMap[tag] = { totalEngagement: 0, count: 0, recentEngagements: [], olderEngagements: [] }
      }
      hashtagMap[tag].totalEngagement += engagement
      hashtagMap[tag].count++
      if (index >= midIndex) {
        hashtagMap[tag].recentEngagements.push(engagement)
      } else {
        hashtagMap[tag].olderEngagements.push(engagement)
      }
    }
  })

  const hashtags = Object.entries(hashtagMap)
    .map(([tag, data]) => {
      const avgEngagement = data.count > 0 ? Math.round(data.totalEngagement / data.count) : 0
      const recentAvg = data.recentEngagements.length > 0
        ? data.recentEngagements.reduce((s, v) => s + v, 0) / data.recentEngagements.length
        : 0
      const olderAvg = data.olderEngagements.length > 0
        ? data.olderEngagements.reduce((s, v) => s + v, 0) / data.olderEngagements.length
        : 0

      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (data.recentEngagements.length > 0 && data.olderEngagements.length > 0) {
        const change = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : (recentAvg > 0 ? 1 : 0)
        if (change > 0.15) trend = 'up'
        else if (change < -0.15) trend = 'down'
      }

      return {
        tag,
        usageCount: data.count,
        avgEngagement,
        totalEngagement: data.totalEngagement,
        trend,
      }
    })
    .sort((a, b) => b.avgEngagement - a.avgEngagement)

  return NextResponse.json({ hashtags })
}
