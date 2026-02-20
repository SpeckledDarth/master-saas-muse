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

interface DailyCount {
  date: string
  count: number
}

function getDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function getStartOfMonth(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function computeVelocity(items: { created_at: string }[], days: number): DailyCount[] {
  const now = new Date()
  const counts: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    counts[d.toISOString().slice(0, 10)] = 0
  }
  for (const item of items) {
    const key = new Date(item.created_at).toISOString().slice(0, 10)
    if (counts[key] !== undefined) counts[key]++
  }
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))
}

function computeMomentum(velocity: DailyCount[]): 'accelerating' | 'steady' | 'decelerating' {
  if (velocity.length < 14) return 'steady'
  const mid = Math.floor(velocity.length / 2)
  const recentHalf = velocity.slice(mid)
  const priorHalf = velocity.slice(0, mid)
  const recentAvg = recentHalf.reduce((s, d) => s + d.count, 0) / recentHalf.length
  const priorAvg = priorHalf.reduce((s, d) => s + d.count, 0) / priorHalf.length
  if (priorAvg === 0 && recentAvg === 0) return 'steady'
  if (priorAvg === 0 && recentAvg > 0) return 'accelerating'
  const change = (recentAvg - priorAvg) / Math.max(priorAvg, 1)
  if (change > 0.15) return 'accelerating'
  if (change < -0.15) return 'decelerating'
  return 'steady'
}

interface NextAction {
  type: 'write' | 'crosspost' | 'repurpose' | 'schedule'
  message: string
  href: string
}

export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const thirtyDaysAgo = getDaysAgo(30)
  const startOfMonth = getStartOfMonth()

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

  const [blogPostsRes, allSocialPostsRes, recentSocialPostsRes, blogConnectionsRes] = await Promise.all([
    safeFetch(() => admin.from('blog_posts').select('id, title, status, platforms, created_at, scheduled_at, published_at, tags, series_name').eq('user_id', user.id)),
    safeFetch(() => admin.from('social_posts').select('id, platform, status, created_at, posted_at, source_blog_id').eq('user_id', user.id)),
    safeFetch(() => admin.from('social_posts').select('id, platform, status, created_at, posted_at, source_blog_id').eq('user_id', user.id).gte('created_at', thirtyDaysAgo)),
    safeFetch(() => admin.from('blog_connections').select('id, platform, is_valid').eq('user_id', user.id)),
  ])

  const blogPosts: any[] = (blogPostsRes as any)?.data || []
  const allSocialPosts: any[] = (allSocialPostsRes as any)?.data || []
  const recentSocialPosts: any[] = (recentSocialPostsRes as any)?.data || []
  const blogConnections: any[] = (blogConnectionsRes as any)?.data || []

  const totalArticles = blogPosts.length
  const articlesThisMonth = blogPosts.filter(bp => bp.created_at >= startOfMonth).length
  const publishedArticles = blogPosts.filter(bp => bp.status === 'published').length

  let totalCrossPosts = 0
  for (const bp of blogPosts) {
    if (Array.isArray(bp.platforms)) {
      totalCrossPosts += bp.platforms.length
    }
  }

  const snippetsFromBlogs = allSocialPosts.filter(sp => sp.source_blog_id)
  const totalSnippets = snippetsFromBlogs.length
  const publishedSnippets = snippetsFromBlogs.filter(sp => sp.status === 'posted' || sp.status === 'scheduled').length
  const draftedSnippets = snippetsFromBlogs.filter(sp => sp.status === 'draft').length

  const allContentItems = [
    ...blogPosts.filter(bp => bp.created_at >= thirtyDaysAgo).map(bp => ({ created_at: bp.created_at })),
    ...recentSocialPosts.map(sp => ({ created_at: sp.created_at })),
  ]
  const velocity = computeVelocity(allContentItems, 30)
  const momentum = computeMomentum(velocity)

  let writingScore = 0
  if (articlesThisMonth >= 4) writingScore = 25
  else if (articlesThisMonth >= 2) writingScore = 18
  else if (articlesThisMonth >= 1) writingScore = 10
  else if (totalArticles > 0) writingScore = 5

  let crossPostScore = 0
  if (totalArticles > 0) {
    const avgPlatforms = totalCrossPosts / totalArticles
    if (avgPlatforms >= 3) crossPostScore = 25
    else if (avgPlatforms >= 2) crossPostScore = 18
    else if (avgPlatforms >= 1) crossPostScore = 12
    else crossPostScore = 5
  }

  let repurposeScore = 0
  if (totalArticles > 0) {
    const repurposeRatio = totalSnippets / totalArticles
    if (repurposeRatio >= 5) repurposeScore = 25
    else if (repurposeRatio >= 3) repurposeScore = 18
    else if (repurposeRatio >= 1) repurposeScore = 10
    else repurposeScore = 3
  }

  let scheduleScore = 0
  if (totalSnippets > 0) {
    const publishRatio = publishedSnippets / totalSnippets
    if (publishRatio >= 0.8) scheduleScore = 25
    else if (publishRatio >= 0.5) scheduleScore = 18
    else if (publishRatio >= 0.2) scheduleScore = 10
    else scheduleScore = 3
  }

  const healthScore = writingScore + crossPostScore + repurposeScore + scheduleScore

  const unrepurposedArticles = blogPosts.filter(bp => {
    const hasSnippets = snippetsFromBlogs.some(sp => sp.source_blog_id === bp.id)
    return !hasSnippets && (bp.status === 'published' || bp.status === 'draft')
  })

  const unscheduledSnippets = snippetsFromBlogs.filter(sp => sp.status === 'draft')

  const recentSocialByPlatform: Record<string, string> = {}
  for (const sp of allSocialPosts) {
    if (!recentSocialByPlatform[sp.platform] || sp.created_at > recentSocialByPlatform[sp.platform]) {
      recentSocialByPlatform[sp.platform] = sp.created_at
    }
  }
  const fiveDaysAgo = getDaysAgo(5)
  const stalePlatforms = Object.entries(recentSocialByPlatform)
    .filter(([_, lastDate]) => lastDate < fiveDaysAgo)
    .map(([platform]) => platform)

  let nextAction: NextAction | null = null
  if (totalArticles === 0) {
    nextAction = { type: 'write', message: 'Write your first blog article to start the content flywheel', href: '/dashboard/social/blog/compose' }
  } else if (unrepurposedArticles.length >= 3) {
    nextAction = { type: 'repurpose', message: `You have ${unrepurposedArticles.length} blog articles without social snippets \u2014 repurpose them now`, href: '/dashboard/social/blog/posts' }
  } else if (unscheduledSnippets.length >= 3) {
    nextAction = { type: 'schedule', message: `You have ${unscheduledSnippets.length} drafted snippets \u2014 schedule them to boost your flywheel`, href: '/dashboard/social/posts' }
  } else if (unrepurposedArticles.length > 0) {
    nextAction = { type: 'repurpose', message: `Repurpose "${unrepurposedArticles[0].title}" into social snippets`, href: '/dashboard/social/blog/posts' }
  } else if (stalePlatforms.length > 0) {
    nextAction = { type: 'write', message: `Your ${stalePlatforms[0]} hasn't had a post in 5+ days \u2014 keep the momentum going`, href: '/dashboard/social/posts' }
  } else if (articlesThisMonth === 0) {
    nextAction = { type: 'write', message: 'No blog articles this month yet \u2014 write one to keep your flywheel spinning', href: '/dashboard/social/blog/compose' }
  }

  const articlePerformance = blogPosts.slice(0, 20).map(bp => {
    const articleSnippets = snippetsFromBlogs.filter(sp => sp.source_blog_id === bp.id)
    return {
      id: bp.id,
      title: bp.title,
      status: bp.status,
      platforms: bp.platforms || [],
      createdAt: bp.created_at,
      publishedAt: bp.published_at,
      snippetCount: articleSnippets.length,
      snippetsPublished: articleSnippets.filter(s => s.status === 'posted' || s.status === 'scheduled').length,
      snippetsDrafted: articleSnippets.filter(s => s.status === 'draft').length,
      tags: bp.tags || [],
      seriesName: bp.series_name,
    }
  })

  return NextResponse.json({
    healthScore,
    momentum,
    breakdown: {
      writing: writingScore,
      crossPosting: crossPostScore,
      repurposing: repurposeScore,
      scheduling: scheduleScore,
    },
    counts: {
      totalArticles,
      articlesThisMonth,
      publishedArticles,
      totalCrossPosts,
      totalSnippets,
      publishedSnippets,
      draftedSnippets,
      connectedBlogPlatforms: blogConnections.filter(c => c.is_valid).length,
    },
    velocity,
    nextAction,
    articlePerformance,
  })
}
