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

function getTotalEngagement(engagementData: any): number {
  if (!engagementData || typeof engagementData !== 'object') return 0
  const likes = Number(engagementData.likes || engagementData.like_count || 0)
  const comments = Number(engagementData.comments || engagementData.comment_count || 0)
  const shares = Number(engagementData.shares || engagementData.share_count || engagementData.retweets || 0)
  const impressions = Number(engagementData.impressions || engagementData.views || 0)
  return likes + comments * 2 + shares * 3 + impressions * 0.01
}

function getContentLengthBucket(length: number): string {
  if (length < 100) return 'short'
  if (length < 300) return 'medium'
  if (length < 800) return 'long'
  return 'very_long'
}

function getHourBucket(hour: number): string {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

const NO_DATA_RESPONSE = {
  predictedEngagement: 'average' as const,
  confidence: 0,
  percentageChange: 0,
  factors: ['Not enough historical data for prediction'],
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { content?: string; platform?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  if (!body.platform || typeof body.platform !== 'string') {
    return NextResponse.json({ error: 'Platform is required' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

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
        .select('content, engagement_data, created_at, posted_at')
        .eq('user_id', user.id)
        .eq('platform', body.platform)
        .not('engagement_data', 'is', null)
    )

    const historicalPosts: any[] = postsRes.data || []

    const postsWithEngagement = historicalPosts.filter(p => {
      const eng = getTotalEngagement(p.engagement_data)
      return eng > 0
    })

    if (postsWithEngagement.length < 3) {
      return NextResponse.json(NO_DATA_RESPONSE)
    }

    const allEngagements = postsWithEngagement.map(p => getTotalEngagement(p.engagement_data))
    const overallAvg = allEngagements.reduce((s, v) => s + v, 0) / allEngagements.length

    if (overallAvg === 0) {
      return NextResponse.json(NO_DATA_RESPONSE)
    }

    const newContentLength = body.content.trim().length
    const newLengthBucket = getContentLengthBucket(newContentLength)
    const currentHour = new Date().getHours()
    const newTimeBucket = getHourBucket(currentHour)

    const factors: string[] = []
    let weightedScore = 0
    let totalWeight = 0

    const sameLengthPosts = postsWithEngagement.filter(p => {
      const len = (p.content || '').length
      return getContentLengthBucket(len) === newLengthBucket
    })

    if (sameLengthPosts.length >= 2) {
      const avgEng = sameLengthPosts.map(p => getTotalEngagement(p.engagement_data))
        .reduce((s, v) => s + v, 0) / sameLengthPosts.length
      const ratio = avgEng / overallAvg
      weightedScore += ratio * 3
      totalWeight += 3

      if (ratio > 1.2) {
        factors.push(`${newLengthBucket}-length posts tend to perform ${Math.round((ratio - 1) * 100)}% better on ${body.platform}`)
      } else if (ratio < 0.8) {
        factors.push(`${newLengthBucket}-length posts tend to perform ${Math.round((1 - ratio) * 100)}% worse on ${body.platform}`)
      } else {
        factors.push(`${newLengthBucket}-length posts perform about average on ${body.platform}`)
      }
    }

    const sameTimePosts = postsWithEngagement.filter(p => {
      const postTime = p.posted_at || p.created_at
      if (!postTime) return false
      const hour = new Date(postTime).getHours()
      return getHourBucket(hour) === newTimeBucket
    })

    if (sameTimePosts.length >= 2) {
      const avgEng = sameTimePosts.map(p => getTotalEngagement(p.engagement_data))
        .reduce((s, v) => s + v, 0) / sameTimePosts.length
      const ratio = avgEng / overallAvg
      weightedScore += ratio * 2
      totalWeight += 2

      if (ratio > 1.2) {
        factors.push(`Posting in the ${newTimeBucket} tends to get ${Math.round((ratio - 1) * 100)}% more engagement`)
      } else if (ratio < 0.8) {
        factors.push(`Posting in the ${newTimeBucket} tends to get ${Math.round((1 - ratio) * 100)}% less engagement`)
      } else {
        factors.push(`${newTimeBucket} posting time shows average engagement`)
      }
    }

    const hasQuestion = body.content.includes('?')
    const hasHashtags = body.content.includes('#')
    const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(body.content)
    const hasUrl = /https?:\/\//.test(body.content)

    if (hasQuestion) factors.push('Questions tend to drive more comments and engagement')
    if (hasHashtags) factors.push('Hashtags can increase discoverability')
    if (hasUrl) factors.push('Posts with links may have lower organic reach on some platforms')

    let featureBoost = 0
    if (hasQuestion) featureBoost += 0.1
    if (hasHashtags) featureBoost += 0.05
    if (hasUrl) featureBoost -= 0.05

    if (totalWeight === 0) {
      weightedScore = 1
      totalWeight = 1
    }

    const predictedRatio = (weightedScore / totalWeight) + featureBoost
    const percentageChange = Math.round((predictedRatio - 1) * 100)

    let predictedEngagement: 'above_average' | 'average' | 'below_average'
    if (predictedRatio > 1.15) {
      predictedEngagement = 'above_average'
    } else if (predictedRatio < 0.85) {
      predictedEngagement = 'below_average'
    } else {
      predictedEngagement = 'average'
    }

    const dataPoints = (sameLengthPosts.length >= 2 ? 1 : 0) + (sameTimePosts.length >= 2 ? 1 : 0)
    const baseConfidence = Math.min(postsWithEngagement.length / 50, 1)
    const confidence = Math.round(Math.min(baseConfidence * (0.3 + dataPoints * 0.35), 1) * 100)

    if (factors.length === 0) {
      factors.push('Based on overall historical engagement patterns')
    }

    return NextResponse.json({
      predictedEngagement,
      confidence,
      percentageChange,
      factors,
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to predict engagement: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}