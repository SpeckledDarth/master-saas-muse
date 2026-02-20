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
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'shall', 'it', 'its', 'this',
  'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
  'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'what',
  'which', 'who', 'whom', 'how', 'when', 'where', 'why', 'not', 'no',
  'so', 'if', 'then', 'than', 'too', 'very', 'just', 'about', 'up',
  'out', 'all', 'also', 'as', 'into', 'more', 'some', 'such', 'only',
  'other', 'new', 'like', 'get', 'got', 'go', 'going', 'make', 'made',
  'know', 'think', 'see', 'come', 'want', 'use', 'here', 'there', 'now',
  'way', 'well', 'even', 'back', 'any', 'good', 'give', 'most', 'after',
  'over', 'much', 'still', 'own', 'one', 'two', 'three', 'don', 't', 's',
  're', 've', 'll', 'amp', 'http', 'https', 'www', 'com',
])

function extractKeywords(text: string): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
}

function getTotalEngagement(engagementData: any): number {
  if (!engagementData || typeof engagementData !== 'object') return 0
  const likes = Number(engagementData.likes || engagementData.like_count || 0)
  const comments = Number(engagementData.comments || engagementData.comment_count || 0)
  const shares = Number(engagementData.shares || engagementData.share_count || engagementData.retweets || 0)
  const impressions = Number(engagementData.impressions || engagementData.views || 0)
  return likes + comments * 2 + shares * 3 + impressions * 0.01
}

export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const safeFetch = async (queryFn: () => PromiseLike<{ data: any; error: any }>) => {
    try {
      const result = await queryFn()
      if (result.error?.code === '42P01' || result.error?.message?.includes('does not exist')) {
        return { data: [] }
      }
      return { data: result.data || [] }
    } catch {
      return { data: [] }
    }
  }

  try {
    const postsRes = await safeFetch(() =>
      admin.from('social_posts')
        .select('id, content, engagement_data, created_at')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })
    )

    const posts: any[] = postsRes.data || []

    if (posts.length < 5) {
      return NextResponse.json({ alerts: [] })
    }

    const topicPostMap: Record<string, { postIndices: number[]; engagements: number[] }> = {}

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i]
      const keywords = extractKeywords(post.content || '')
      const engagement = getTotalEngagement(post.engagement_data)
      const uniqueKeywords = [...new Set(keywords)]

      for (const keyword of uniqueKeywords) {
        if (!topicPostMap[keyword]) {
          topicPostMap[keyword] = { postIndices: [], engagements: [] }
        }
        topicPostMap[keyword].postIndices.push(i)
        topicPostMap[keyword].engagements.push(engagement)
      }
    }

    const alerts: Array<{ topic: string; postCount: number; engagementDrop: number; suggestion: string }> = []

    for (const [topic, data] of Object.entries(topicPostMap)) {
      if (data.postIndices.length < 5) continue

      const mid = Math.floor(data.engagements.length / 2)
      const firstHalf = data.engagements.slice(0, mid)
      const secondHalf = data.engagements.slice(mid)

      const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length

      if (firstAvg === 0) continue

      const drop = (firstAvg - secondAvg) / firstAvg

      if (drop > 0.3) {
        const dropPercent = Math.round(drop * 100)
        const suggestions = [
          `Try a different angle on "${topic}"`,
          `Take a break from "${topic}" for a week`,
          `Reframe your "${topic}" content with a fresh perspective`,
        ]
        const suggestion = suggestions[alerts.length % suggestions.length]

        alerts.push({
          topic,
          postCount: data.postIndices.length,
          engagementDrop: dropPercent,
          suggestion,
        })
      }
    }

    alerts.sort((a, b) => b.engagementDrop - a.engagementDrop)

    return NextResponse.json({ alerts: alerts.slice(0, 10) })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to analyze topic fatigue: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
