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

function getMonthRange(monthStr?: string): { start: string; end: string; label: string } {
  const now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth()
  if (monthStr) {
    const parts = monthStr.split('-')
    if (parts.length === 2) { year = parseInt(parts[0]); month = parseInt(parts[1]) - 1 }
  }
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  const label = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return { start: start.toISOString(), end: end.toISOString(), label }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const { month, brandName, brandLogo } = body as { month?: string; brandName?: string; brandLogo?: string }
    const { start, end, label } = getMonthRange(month)

    const admin = getSupabaseAdmin()

    const [postsRes, blogsRes] = await Promise.all([
      safeFetch(() => admin.from('social_posts').select('id, platform, content, status, likes_count, comments_count, shares_count, clicks_count, ai_generated, created_at').eq('user_id', user.id).gte('created_at', start).lte('created_at', end)),
      safeFetch(() => admin.from('blog_posts').select('id, title, status, created_at').eq('user_id', user.id).gte('created_at', start).lte('created_at', end)),
    ])

    const posts: any[] = postsRes.data
    const blogs: any[] = blogsRes.data
    const totalPosts = posts.length
    const totalBlogs = blogs.length

    const getEngagement = (p: any) => (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0) + (p.clicks_count || 0)
    const totalEngagement = posts.reduce((sum: number, p: any) => sum + getEngagement(p), 0)
    const totalLikes = posts.reduce((s: number, p: any) => s + (p.likes_count || 0), 0)
    const totalComments = posts.reduce((s: number, p: any) => s + (p.comments_count || 0), 0)
    const totalShares = posts.reduce((s: number, p: any) => s + (p.shares_count || 0), 0)
    const totalClicks = posts.reduce((s: number, p: any) => s + (p.clicks_count || 0), 0)

    const platformCounts: Record<string, number> = {}
    for (const p of posts) { platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1 }

    const sorted = [...posts].sort((a, b) => getEngagement(b) - getEngagement(a))
    const topPosts = sorted.slice(0, 3)

    const recommendations: string[] = []
    if (totalPosts < 10) recommendations.push('Increase posting frequency to at least 10 posts per month')
    if (totalBlogs === 0) recommendations.push('Write blog articles to fuel your content flywheel')
    if (totalEngagement / Math.max(totalPosts, 1) < 5) recommendations.push('Focus on engagement-driving content formats')

    const maxBar = Math.max(totalLikes, totalComments, totalShares, totalClicks, 1)
    const barWidth = (val: number) => Math.round((val / maxBar) * 100)

    const displayName = brandName || 'Content Performance'
    const logoHtml = brandLogo ? `<img src="${brandLogo}" alt="Logo" style="max-height:48px;margin-bottom:12px;" />` : ''

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${displayName} - ${label} Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #e5e7eb; padding-bottom: 24px; }
  .header h1 { font-size: 28px; margin-bottom: 4px; }
  .header p { color: #6b7280; font-size: 14px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
  .stat-card .value { font-size: 28px; font-weight: 700; color: #111827; }
  .stat-card .label { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .section { margin-bottom: 28px; }
  .section h2 { font-size: 18px; margin-bottom: 12px; color: #111827; }
  .bar-chart { margin-bottom: 16px; }
  .bar-row { display: flex; align-items: center; margin-bottom: 8px; }
  .bar-label { width: 100px; font-size: 13px; color: #4b5563; }
  .bar-track { flex: 1; background: #f3f4f6; border-radius: 4px; height: 24px; overflow: hidden; }
  .bar-fill { height: 100%; background: #3b82f6; border-radius: 4px; display: flex; align-items: center; padding-left: 8px; color: white; font-size: 12px; font-weight: 600; min-width: 30px; }
  .top-post { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 10px; }
  .top-post .platform { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .top-post .content { font-size: 13px; margin-top: 4px; color: #374151; }
  .top-post .eng { font-size: 12px; color: #3b82f6; margin-top: 4px; }
  .recs { list-style: disc; padding-left: 20px; }
  .recs li { font-size: 13px; color: #4b5563; margin-bottom: 6px; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 11px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  ${logoHtml}
  <h1>${displayName}</h1>
  <p>Monthly Content Report - ${label}</p>
</div>
<div class="stats-grid">
  <div class="stat-card"><div class="value">${totalPosts}</div><div class="label">Posts</div></div>
  <div class="stat-card"><div class="value">${totalBlogs}</div><div class="label">Blog Articles</div></div>
  <div class="stat-card"><div class="value">${totalEngagement}</div><div class="label">Total Engagement</div></div>
  <div class="stat-card"><div class="value">${Object.keys(platformCounts).length}</div><div class="label">Platforms</div></div>
</div>
<div class="section">
  <h2>Engagement Breakdown</h2>
  <div class="bar-chart">
    <div class="bar-row"><div class="bar-label">Likes</div><div class="bar-track"><div class="bar-fill" style="width:${barWidth(totalLikes)}%">${totalLikes}</div></div></div>
    <div class="bar-row"><div class="bar-label">Comments</div><div class="bar-track"><div class="bar-fill" style="width:${barWidth(totalComments)}%">${totalComments}</div></div></div>
    <div class="bar-row"><div class="bar-label">Shares</div><div class="bar-track"><div class="bar-fill" style="width:${barWidth(totalShares)}%">${totalShares}</div></div></div>
    <div class="bar-row"><div class="bar-label">Clicks</div><div class="bar-track"><div class="bar-fill" style="width:${barWidth(totalClicks)}%">${totalClicks}</div></div></div>
  </div>
</div>
${topPosts.length > 0 ? `<div class="section"><h2>Top Posts</h2>${topPosts.map(p => `<div class="top-post"><div class="platform">${p.platform}</div><div class="content">${(p.content || '').slice(0, 200)}</div><div class="eng">${getEngagement(p)} engagements</div></div>`).join('')}</div>` : ''}
${recommendations.length > 0 ? `<div class="section"><h2>Recommendations</h2><ul class="recs">${recommendations.map(r => `<li>${r}</li>`).join('')}</ul></div>` : ''}
<div class="footer">Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
</body>
</html>`

    return NextResponse.json({ html })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate export report' }, { status: 500 })
  }
}
