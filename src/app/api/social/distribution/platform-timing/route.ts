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
  try { const r = await queryFn(); if (r.error?.code === '42P01' || r.error?.message?.includes('does not exist')) return { data: [] }; return { data: r.data || [] } } catch { return { data: [] } }
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12:00 AM'
  if (hour === 12) return '12:00 PM'
  if (hour < 12) return `${hour}:00 AM`
  return `${hour - 12}:00 PM`
}

interface TimeSlot {
  hour: number
  label: string
  avgEngagement: number
}

interface PlatformTiming {
  platform: string
  bestTimes: TimeSlot[]
  worstTimes: TimeSlot[]
  totalPosts: number
}

const DEFAULT_BEST_TIMES: TimeSlot[] = [
  { hour: 9, label: '9:00 AM', avgEngagement: 0 },
  { hour: 12, label: '12:00 PM', avgEngagement: 0 },
  { hour: 17, label: '5:00 PM', avgEngagement: 0 },
]

const DEFAULT_WORST_TIMES: TimeSlot[] = [
  { hour: 2, label: '2:00 AM', avgEngagement: 0 },
  { hour: 4, label: '4:00 AM', avgEngagement: 0 },
  { hour: 23, label: '11:00 PM', avgEngagement: 0 },
]

function calculateEngagementScore(engagementData: any): number {
  if (!engagementData || typeof engagementData !== 'object') return 0
  const likes = Number(engagementData.likes || engagementData.like_count || 0)
  const comments = Number(engagementData.comments || engagementData.comment_count || 0)
  const shares = Number(engagementData.shares || engagementData.share_count || engagementData.retweets || 0)
  const impressions = Number(engagementData.impressions || engagementData.views || 0)
  return likes + (comments * 2) + (shares * 3) + (impressions * 0.1)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdmin()

    const postsRes = await safeFetch(() =>
      admin
        .from('social_posts')
        .select('id, platform, scheduled_at, created_at, engagement_data, status')
        .eq('user_id', user.id)
        .not('engagement_data', 'is', null)
    )

    const posts = postsRes.data as any[]

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        platforms: [{
          platform: 'all',
          bestTimes: DEFAULT_BEST_TIMES,
          worstTimes: DEFAULT_WORST_TIMES,
          totalPosts: 0,
        }]
      })
    }

    const platformGroups: Record<string, any[]> = {}
    for (const post of posts) {
      const platform = post.platform || 'unknown'
      if (!platformGroups[platform]) platformGroups[platform] = []
      platformGroups[platform].push(post)
    }

    const platforms: PlatformTiming[] = []

    for (const [platform, platformPosts] of Object.entries(platformGroups)) {
      const hourlyData: Record<number, { totalEngagement: number; count: number }> = {}

      for (let h = 0; h < 24; h++) {
        hourlyData[h] = { totalEngagement: 0, count: 0 }
      }

      for (const post of platformPosts) {
        const dateStr = post.scheduled_at || post.created_at
        if (!dateStr) continue

        const date = new Date(dateStr)
        const hour = date.getUTCHours()
        const engagement = calculateEngagementScore(post.engagement_data)

        hourlyData[hour].totalEngagement += engagement
        hourlyData[hour].count += 1
      }

      const hourlyAverages: TimeSlot[] = Object.entries(hourlyData)
        .filter(([_, data]) => data.count > 0)
        .map(([hour, data]) => ({
          hour: Number(hour),
          label: formatHourLabel(Number(hour)),
          avgEngagement: Math.round((data.totalEngagement / data.count) * 100) / 100,
        }))

      if (hourlyAverages.length === 0) {
        platforms.push({
          platform,
          bestTimes: DEFAULT_BEST_TIMES,
          worstTimes: DEFAULT_WORST_TIMES,
          totalPosts: platformPosts.length,
        })
        continue
      }

      const sorted = [...hourlyAverages].sort((a, b) => b.avgEngagement - a.avgEngagement)
      const bestTimes = sorted.slice(0, 3)
      const worstTimes = sorted.slice(-3).reverse()

      platforms.push({
        platform,
        bestTimes,
        worstTimes: worstTimes.length > 0 ? worstTimes : DEFAULT_WORST_TIMES,
        totalPosts: platformPosts.length,
      })
    }

    platforms.sort((a, b) => b.totalPosts - a.totalPosts)

    return NextResponse.json({ platforms })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to calculate platform timing' }, { status: 500 })
  }
}
