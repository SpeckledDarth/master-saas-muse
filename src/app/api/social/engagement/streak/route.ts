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

function calculateStreak(dates: string[]): { currentStreak: number; longestStreak: number; lastActivityDate: string; streakActive: boolean } {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0, lastActivityDate: '', streakActive: false }

  const uniqueDays = [...new Set(dates.map(d => new Date(d).toISOString().slice(0, 10)))].sort().reverse()
  const lastActivityDate = uniqueDays[0]

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const streakActive = uniqueDays[0] === today || uniqueDays[0] === yesterday

  let currentStreak = 0
  if (streakActive) {
    const startDate = uniqueDays[0] === today ? today : yesterday
    let checkDate = new Date(startDate)
    const daySet = new Set(uniqueDays)
    while (daySet.has(checkDate.toISOString().slice(0, 10))) {
      currentStreak++
      checkDate = new Date(checkDate.getTime() - 86400000)
    }
  }

  let longestStreak = 0
  let tempStreak = 1
  const sortedAsc = [...uniqueDays].reverse()
  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1])
    const curr = new Date(sortedAsc[i])
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    if (diffDays === 1) { tempStreak++ } else { longestStreak = Math.max(longestStreak, tempStreak); tempStreak = 1 }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

  return { currentStreak, longestStreak, lastActivityDate, streakActive }
}

async function getStreakData(userId: string) {
  const admin = getSupabaseAdmin()

  const [postsRes, blogsRes] = await Promise.all([
    safeFetch(() => admin.from('social_posts').select('created_at').eq('user_id', userId)),
    safeFetch(() => admin.from('blog_posts').select('created_at').eq('user_id', userId)),
  ])

  const allDates = [
    ...(postsRes.data as any[]).map((p: any) => p.created_at),
    ...(blogsRes.data as any[]).map((b: any) => b.created_at),
  ].filter(Boolean)

  return calculateStreak(allDates)
}

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const streak = await getStreakData(user.id)
    return NextResponse.json(streak)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to calculate streak' }, { status: 500 })
  }
}

export async function POST(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const streak = await getStreakData(user.id)
    return NextResponse.json(streak)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to calculate streak' }, { status: 500 })
  }
}
