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

const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
  'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
  'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'has',
  'had', 'did', 'does', 'am', 'being', 'having', 'doing', 'here', 'more',
])

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function extractTopics(posts: { content: string }[]): string[] {
  const wordCounts: Record<string, number> = {}

  for (const post of posts) {
    if (!post.content) continue
    const words = post.content.toLowerCase()
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w))

    const seen = new Set<string>()
    for (const word of words) {
      if (!seen.has(word)) {
        seen.add(word)
        wordCounts[word] = (wordCounts[word] || 0) + 1
      }
    }
  }

  return Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}

function extractEngagement(engagementData: any): number {
  if (!engagementData) return 0
  if (typeof engagementData === 'number') return engagementData
  if (typeof engagementData === 'object') {
    const likes = engagementData.likes || engagementData.like_count || 0
    const comments = engagementData.comments || engagementData.comment_count || 0
    const shares = engagementData.shares || engagementData.share_count || engagementData.retweets || 0
    return likes + comments * 2 + shares * 3
  }
  return 0
}

export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  try {
    const { data: posts, error } = await admin
      .from('social_posts')
      .select('id, content, platform, status, created_at, posted_at, engagement_data, source_blog_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error && error.code === '42P01') {
      return NextResponse.json({
        topTopics: [],
        bestTimes: [],
        optimalLength: [],
        aiVsManual: { aiAvgEngagement: 0, manualAvgEngagement: 0 },
      })
    }

    const allPosts = posts || []
    const postedPosts = allPosts.filter(p => p.status === 'posted' && p.posted_at)

    const topTopics = extractTopics(allPosts)

    const timeEngagement: Record<string, { total: number; count: number }> = {}
    for (const post of postedPosts) {
      const date = new Date(post.posted_at)
      const day = DAY_NAMES[date.getUTCDay()]
      const hour = date.getUTCHours()
      const key = `${day}-${hour}`
      if (!timeEngagement[key]) {
        timeEngagement[key] = { total: 0, count: 0 }
      }
      timeEngagement[key].total += extractEngagement(post.engagement_data)
      timeEngagement[key].count++
    }

    const bestTimes = Object.entries(timeEngagement)
      .map(([key, val]) => {
        const [day, hourStr] = key.split('-')
        return { day, hour: parseInt(hourStr, 10), avgEngagement: val.count > 0 ? val.total / val.count : 0 }
      })
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5)
      .map(({ day, hour }) => ({ day, hour }))

    const platformLengths: Record<string, { totalChars: number; totalEngagement: number; count: number }> = {}
    for (const post of postedPosts) {
      const platform = post.platform || 'unknown'
      if (!platformLengths[platform]) {
        platformLengths[platform] = { totalChars: 0, totalEngagement: 0, count: 0 }
      }
      const engagement = extractEngagement(post.engagement_data)
      platformLengths[platform].totalChars += (post.content || '').length
      platformLengths[platform].totalEngagement += engagement
      platformLengths[platform].count++
    }

    const optimalLength = Object.entries(platformLengths)
      .filter(([, val]) => val.count > 0)
      .map(([platform, val]) => ({
        platform,
        chars: Math.round(val.totalChars / val.count),
      }))

    const aiPosts = postedPosts.filter(p => p.source_blog_id)
    const manualPosts = postedPosts.filter(p => !p.source_blog_id)

    const aiTotalEngagement = aiPosts.reduce((sum, p) => sum + extractEngagement(p.engagement_data), 0)
    const manualTotalEngagement = manualPosts.reduce((sum, p) => sum + extractEngagement(p.engagement_data), 0)

    const aiVsManual = {
      aiAvgEngagement: aiPosts.length > 0 ? Math.round(aiTotalEngagement / aiPosts.length) : 0,
      manualAvgEngagement: manualPosts.length > 0 ? Math.round(manualTotalEngagement / manualPosts.length) : 0,
    }

    return NextResponse.json({
      topTopics,
      bestTimes,
      optimalLength,
      aiVsManual,
    })
  } catch (error) {
    return NextResponse.json({ error: `Failed to analyze content DNA: ${(error as Error).message}` }, { status: 500 })
  }
}
