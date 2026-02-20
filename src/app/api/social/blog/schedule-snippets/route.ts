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

const BEST_HOURS = [9, 12, 15, 17, 19]

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { blogPostId?: string; snippetIds?: string[]; spreadDays?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const spreadDays = Math.min(Math.max(body.spreadDays || 10, 3), 30)

  let snippetIds: string[] = body.snippetIds || []

  if (body.blogPostId && snippetIds.length === 0) {
    const { data: posts } = await admin
      .from('social_posts')
      .select('id')
      .eq('source_blog_id', body.blogPostId)
      .eq('user_id', user.id)
      .eq('status', 'draft')

    if (posts) {
      snippetIds = posts.map(p => p.id)
    }
  }

  if (snippetIds.length === 0) {
    return NextResponse.json({ error: 'No draft snippets found to schedule' }, { status: 400 })
  }

  const now = new Date()
  const scheduledPosts: { id: string; scheduled_for: string }[] = []

  let dayOffset = 1
  for (let i = 0; i < snippetIds.length; i++) {
    const hour = BEST_HOURS[i % BEST_HOURS.length]

    let scheduleDate = new Date(now)
    scheduleDate.setDate(scheduleDate.getDate() + dayOffset)
    scheduleDate.setHours(hour, 0, 0, 0)

    while (scheduleDate.getDay() === 0 || scheduleDate.getDay() === 6) {
      scheduleDate.setDate(scheduleDate.getDate() + 1)
    }

    scheduledPosts.push({
      id: snippetIds[i],
      scheduled_for: scheduleDate.toISOString(),
    })

    const gap = Math.max(1, Math.floor(spreadDays / snippetIds.length))
    dayOffset += gap
  }

  const results: { id: string; scheduled_for: string; error?: string }[] = []

  for (const post of scheduledPosts) {
    const { error } = await admin
      .from('social_posts')
      .update({
        status: 'scheduled',
        scheduled_at: post.scheduled_for,
      })
      .eq('id', post.id)
      .eq('user_id', user.id)
      .eq('status', 'draft')

    results.push({
      id: post.id,
      scheduled_for: post.scheduled_for,
      ...(error ? { error: error.message } : {}),
    })
  }

  const scheduled = results.filter(r => !r.error)

  return NextResponse.json({
    scheduled: scheduled.length,
    total: snippetIds.length,
    results,
    spreadDays,
  })
}
