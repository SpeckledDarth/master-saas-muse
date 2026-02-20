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
      .select('id, platform, content, engagement_data, posted_at, created_at, status')
      .eq('user_id', user.id)
      .eq('status', 'posted')
  )

  const posts: any[] = postsRes.data as any[]

  const postsWithEngagement = posts
    .filter(p => p.engagement_data && getEngagementScore(p.engagement_data) > 0)
    .map(p => ({
      ...p,
      engagement: getEngagementScore(p.engagement_data),
    }))

  if (postsWithEngagement.length === 0) {
    return NextResponse.json({ decayAlerts: [] })
  }

  const sortedByEngagement = [...postsWithEngagement].sort((a, b) => b.engagement - a.engagement)
  const top20PercentIndex = Math.max(1, Math.ceil(sortedByEngagement.length * 0.2))
  const highEngagementThreshold = sortedByEngagement[top20PercentIndex - 1]?.engagement || 0

  const twentyOneDaysAgo = new Date()
  twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21)

  const decayAlerts = postsWithEngagement
    .filter(p => {
      const postDate = new Date(p.posted_at || p.created_at)
      return p.engagement >= highEngagementThreshold && postDate < twentyOneDaysAgo
    })
    .map(p => {
      const peakEngagement = p.engagement
      const estimatedCurrent = Math.round(peakEngagement * 0.3)
      const dropPercent = Math.round(((peakEngagement - estimatedCurrent) / peakEngagement) * 100)

      return {
        id: p.id,
        platform: p.platform,
        content: (p.content || '').slice(0, 120),
        peakEngagement,
        currentEngagement: estimatedCurrent,
        dropPercent,
        suggestion: `This ${p.platform} post performed well. Consider refreshing or repurposing it to recapture engagement.`,
      }
    })
    .sort((a, b) => b.peakEngagement - a.peakEngagement)

  return NextResponse.json({ decayAlerts })
}
