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

function getStartOfMonth(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function assignGrade(score: number): string {
  if (score >= 80) return 'A'
  if (score >= 60) return 'B'
  if (score >= 40) return 'C'
  if (score >= 20) return 'D'
  return 'F'
}

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdmin()
    const startOfMonth = getStartOfMonth()

    const [postsRes, blogsRes] = await Promise.all([
      safeFetch(() => admin.from('social_posts').select('id, platform, content, status, likes_count, comments_count, shares_count, clicks_count, ai_generated, created_at').eq('user_id', user.id).gte('created_at', startOfMonth)),
      safeFetch(() => admin.from('blog_posts').select('id, title, status, created_at').eq('user_id', user.id).gte('created_at', startOfMonth)),
    ])

    const posts: any[] = postsRes.data
    const blogs: any[] = blogsRes.data
    const totalPosts = posts.length
    const totalBlogs = blogs.length

    const getEngagement = (p: any) => (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0) + (p.clicks_count || 0)
    const totalEngagement = posts.reduce((sum, p) => sum + getEngagement(p), 0)

    let topPost = null
    let worstPost = null
    let topEngagement = -1
    let worstEngagement = Infinity

    for (const p of posts) {
      const eng = getEngagement(p)
      if (eng > topEngagement) { topEngagement = eng; topPost = { platform: p.platform, content: (p.content || '').slice(0, 200), engagement: eng } }
      if (eng < worstEngagement) { worstEngagement = eng; worstPost = { platform: p.platform, content: (p.content || '').slice(0, 200), engagement: eng } }
    }

    const promotional = posts.filter(p => (p.content || '').toLowerCase().match(/buy|sale|discount|offer|promo|deal|shop/)).length
    const educational = posts.filter(p => (p.content || '').toLowerCase().match(/how|tip|learn|guide|tutorial|step/)).length
    const entertaining = totalPosts - promotional - educational
    const contentMix = { promotional, educational, entertaining }

    let writingScore = 0
    if (totalBlogs >= 4) writingScore = 25
    else if (totalBlogs >= 2) writingScore = 18
    else if (totalBlogs >= 1) writingScore = 10

    let postingScore = 0
    if (totalPosts >= 20) postingScore = 25
    else if (totalPosts >= 10) postingScore = 18
    else if (totalPosts >= 5) postingScore = 12
    else if (totalPosts >= 1) postingScore = 5

    let engagementScore = 0
    const avgEngagement = totalPosts > 0 ? totalEngagement / totalPosts : 0
    if (avgEngagement >= 50) engagementScore = 25
    else if (avgEngagement >= 20) engagementScore = 18
    else if (avgEngagement >= 5) engagementScore = 10
    else if (avgEngagement > 0) engagementScore = 5

    let mixScore = 0
    const hasVariety = (promotional > 0 ? 1 : 0) + (educational > 0 ? 1 : 0) + (entertaining > 0 ? 1 : 0)
    if (hasVariety >= 3) mixScore = 25
    else if (hasVariety >= 2) mixScore = 15
    else if (hasVariety >= 1) mixScore = 8

    const flywheelScore = writingScore + postingScore + engagementScore + mixScore
    const grade = assignGrade(flywheelScore)

    const recommendations: string[] = []
    if (totalBlogs === 0) recommendations.push('Write at least one blog article this month to fuel your content flywheel')
    if (totalPosts < 10) recommendations.push('Increase your posting frequency to at least 10 posts per month')
    if (avgEngagement < 5) recommendations.push('Focus on creating more engaging content with questions and calls-to-action')
    if (hasVariety < 3) recommendations.push('Diversify your content mix with promotional, educational, and entertaining posts')
    if (promotional > educational + entertaining) recommendations.push('Reduce promotional content ratio - aim for 80% value, 20% promotion')

    return NextResponse.json({
      grade,
      flywheelScore,
      totalPosts,
      totalBlogs,
      totalEngagement,
      topPost,
      worstPost,
      contentMix,
      recommendations,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate report card' }, { status: 500 })
  }
}
