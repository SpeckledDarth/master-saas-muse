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

function getWeekAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString()
}

function getStartOfMonth(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

const SUGGESTED_TOPICS = [
  '5 common mistakes your customers make (and how to avoid them)',
  'Behind the scenes: A day in your business',
  'The ultimate FAQ: Answering your top customer questions',
  'Industry trends your audience needs to know about',
  'Case study: How you helped a customer achieve results',
  'Seasonal tips and strategies for your industry',
]

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdmin()
    const weekAgo = getWeekAgo()
    const startOfMonth = getStartOfMonth()

    const [weekPostsRes, weekBlogsRes, monthPostsRes, monthBlogsRes, allPostsRes, allBlogsRes] = await Promise.all([
      safeFetch(() => admin.from('social_posts').select('id, platform, content, likes_count, comments_count, shares_count, clicks_count, source_blog_id, created_at').eq('user_id', user.id).gte('created_at', weekAgo)),
      safeFetch(() => admin.from('blog_posts').select('id, title, created_at').eq('user_id', user.id).gte('created_at', weekAgo)),
      safeFetch(() => admin.from('social_posts').select('id, source_blog_id, created_at').eq('user_id', user.id).gte('created_at', startOfMonth)),
      safeFetch(() => admin.from('blog_posts').select('id, created_at').eq('user_id', user.id).gte('created_at', startOfMonth)),
      safeFetch(() => admin.from('social_posts').select('created_at').eq('user_id', user.id)),
      safeFetch(() => admin.from('blog_posts').select('created_at').eq('user_id', user.id)),
    ])

    const weekPosts: any[] = weekPostsRes.data
    const weekBlogs: any[] = weekBlogsRes.data
    const monthPosts: any[] = monthPostsRes.data
    const monthBlogs: any[] = monthBlogsRes.data

    const postsCreated = weekPosts.length
    const blogsWritten = weekBlogs.length
    const snippetsGenerated = weekPosts.filter(p => p.source_blog_id).length

    const getEngagement = (p: any) => (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0) + (p.clicks_count || 0)
    let topPostThisWeek = null
    let topEng = -1
    for (const p of weekPosts) {
      const eng = getEngagement(p)
      if (eng > topEng) { topEng = eng; topPostThisWeek = { platform: p.platform, content: (p.content || '').slice(0, 200), engagement: eng } }
    }

    let writingScore = 0
    const monthBlogCount = monthBlogs.length
    if (monthBlogCount >= 4) writingScore = 25
    else if (monthBlogCount >= 2) writingScore = 18
    else if (monthBlogCount >= 1) writingScore = 10

    let postingScore = 0
    const monthPostCount = monthPosts.length
    if (monthPostCount >= 20) postingScore = 25
    else if (monthPostCount >= 10) postingScore = 18
    else if (monthPostCount >= 5) postingScore = 12
    else if (monthPostCount >= 1) postingScore = 5

    const repurposeRatio = monthBlogCount > 0 ? monthPosts.filter(p => p.source_blog_id).length / monthBlogCount : 0
    let repurposeScore = 0
    if (repurposeRatio >= 5) repurposeScore = 25
    else if (repurposeRatio >= 3) repurposeScore = 18
    else if (repurposeRatio >= 1) repurposeScore = 10

    const flywheelScore = writingScore + postingScore + repurposeScore + Math.min(25, Math.round(repurposeRatio * 5))

    const allDates = [
      ...(allPostsRes.data as any[]).map((p: any) => p.created_at),
      ...(allBlogsRes.data as any[]).map((b: any) => b.created_at),
    ].filter(Boolean)
    const uniqueDays = [...new Set(allDates.map(d => new Date(d).toISOString().slice(0, 10)))].sort().reverse()
    let streak = 0
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
      const startDate = uniqueDays[0] === today ? today : yesterday
      let checkDate = new Date(startDate)
      const daySet = new Set(uniqueDays)
      while (daySet.has(checkDate.toISOString().slice(0, 10))) {
        streak++
        checkDate = new Date(checkDate.getTime() - 86400000)
      }
    }

    const recommendations: string[] = []
    if (postsCreated === 0) recommendations.push('You had no posts this week - try to create at least 3 posts weekly')
    if (blogsWritten === 0) recommendations.push('Write a blog article to generate social content from')
    if (snippetsGenerated === 0 && blogsWritten > 0) recommendations.push('Repurpose your blog articles into social snippets')
    if (streak === 0) recommendations.push('Start a content streak by creating content every day')

    const suggestedBlogTopic = SUGGESTED_TOPICS[Math.floor(Math.random() * SUGGESTED_TOPICS.length)]

    return NextResponse.json({
      flywheelScore,
      weekSummary: { postsCreated, blogsWritten, snippetsGenerated },
      topPostThisWeek,
      suggestedBlogTopic,
      streak,
      recommendations,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate digest preview' }, { status: 500 })
  }
}
