import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const safeFetch = async (queryFn: () => PromiseLike<{ data: any; error: any }>) => {
  try { const r = await queryFn(); if (r.error?.code === '42P01' || r.error?.message?.includes('does not exist')) return { data: [] }; return { data: r.data || [] } } catch { return { data: [] } }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params
    if (!username) return NextResponse.json({ error: 'Username is required' }, { status: 400 })

    const admin = getSupabaseAdmin()

    const { data: users, error: userError } = await admin.auth.admin.listUsers()
    if (userError) return NextResponse.json({ error: 'Failed to look up user' }, { status: 500 })

    const matchedUser = users.users.find(u => {
      const emailPrefix = u.email?.split('@')[0]?.toLowerCase()
      const metaUsername = (u.user_metadata?.username || u.user_metadata?.display_name || '').toLowerCase()
      return emailPrefix === username.toLowerCase() || metaUsername === username.toLowerCase()
    })

    if (!matchedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const [postsRes, blogsRes] = await Promise.all([
      safeFetch(() => admin.from('social_posts').select('id, status, likes_count, comments_count, shares_count, clicks_count, created_at').eq('user_id', matchedUser.id)),
      safeFetch(() => admin.from('blog_posts').select('id, status, created_at').eq('user_id', matchedUser.id)),
    ])

    const posts: any[] = postsRes.data
    const blogs: any[] = blogsRes.data

    const postsPublished = posts.filter(p => p.status === 'posted').length
    const blogsWritten = blogs.length
    const totalEngagement = posts.reduce((sum, p) => sum + (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0) + (p.clicks_count || 0), 0)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthPosts = posts.filter(p => p.created_at >= startOfMonth).length
    const monthBlogs = blogs.filter(b => b.created_at >= startOfMonth).length
    let flywheelScore = 0
    if (monthBlogs >= 4) flywheelScore += 25
    else if (monthBlogs >= 2) flywheelScore += 18
    else if (monthBlogs >= 1) flywheelScore += 10
    if (monthPosts >= 20) flywheelScore += 25
    else if (monthPosts >= 10) flywheelScore += 18
    else if (monthPosts >= 5) flywheelScore += 12
    else if (monthPosts >= 1) flywheelScore += 5
    const avgEng = monthPosts > 0 ? totalEngagement / monthPosts : 0
    if (avgEng >= 50) flywheelScore += 25
    else if (avgEng >= 20) flywheelScore += 18
    else if (avgEng >= 5) flywheelScore += 10

    const allDates = [
      ...posts.map(p => p.created_at),
      ...blogs.map(b => b.created_at),
    ].filter(Boolean)
    const uniqueDays = [...new Set(allDates.map(d => new Date(d).toISOString().slice(0, 10)))].sort().reverse()
    let streak = 0
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (uniqueDays.length > 0 && (uniqueDays[0] === today || uniqueDays[0] === yesterday)) {
      const startDate = uniqueDays[0] === today ? today : yesterday
      let checkDate = new Date(startDate)
      const daySet = new Set(uniqueDays)
      while (daySet.has(checkDate.toISOString().slice(0, 10))) {
        streak++
        checkDate = new Date(checkDate.getTime() - 86400000)
      }
    }

    const memberSince = matchedUser.created_at

    return NextResponse.json({
      username,
      stats: {
        postsPublished,
        blogsWritten,
        totalEngagement,
        flywheelScore,
        streak,
        memberSince,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch scorecard' }, { status: 500 })
  }
}
