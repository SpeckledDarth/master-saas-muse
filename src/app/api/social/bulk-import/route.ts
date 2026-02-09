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

const VALID_PLATFORMS = ['twitter', 'linkedin', 'facebook', 'instagram', 'youtube', 'tiktok', 'reddit', 'pinterest', 'snapchat', 'discord']

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { posts?: { content: string; platform: string; scheduled_at: string }[] }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const posts = body.posts
  if (!Array.isArray(posts) || posts.length === 0) {
    return NextResponse.json({ error: 'Posts array is required and must not be empty' }, { status: 400 })
  }

  const validPosts: { content: string; platform: string; scheduled_at: string }[] = []
  const errors: string[] = []

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i]

    if (!p.content || typeof p.content !== 'string' || !p.content.trim()) {
      errors.push(`Row ${i + 1}: Content is empty`)
      continue
    }

    if (!p.platform || !VALID_PLATFORMS.includes(p.platform.toLowerCase())) {
      errors.push(`Row ${i + 1}: Invalid platform "${p.platform}"`)
      continue
    }

    if (!p.scheduled_at) {
      errors.push(`Row ${i + 1}: Missing scheduled date`)
      continue
    }

    const d = new Date(p.scheduled_at)
    if (isNaN(d.getTime())) {
      errors.push(`Row ${i + 1}: Invalid date "${p.scheduled_at}"`)
      continue
    }

    validPosts.push({
      content: p.content.trim(),
      platform: p.platform.toLowerCase(),
      scheduled_at: d.toISOString(),
    })
  }

  if (validPosts.length === 0) {
    return NextResponse.json({ imported: 0, errors }, { status: 200 })
  }

  try {
    const admin = getSupabaseAdmin()

    const rows = validPosts.map(p => ({
      user_id: user.id,
      platform: p.platform,
      content: p.content,
      media_urls: [],
      status: 'scheduled',
      scheduled_at: p.scheduled_at,
      ai_generated: false,
    }))

    const { data, error } = await admin
      .from('social_posts')
      .insert(rows)
      .select('id')

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Social posts table not yet created. Run migrations first.',
          imported: 0,
          errors: ['Table not found'],
        }, { status: 500 })
      }
      return NextResponse.json({ error: error.message, imported: 0, errors: [error.message] }, { status: 500 })
    }

    return NextResponse.json({
      imported: data?.length || validPosts.length,
      errors,
    })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json({ error: 'Failed to import posts', imported: 0, errors: ['Server error'] }, { status: 500 })
  }
}
