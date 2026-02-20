import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { BLOG_PLATFORMS } from '@/lib/social/types'
import type { BlogPlatform } from '@/lib/social/types'

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

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const seriesFilter = searchParams.get('series')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200)

  try {
    const admin = getSupabaseAdmin()
    let query = admin
      .from('blog_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    if (seriesFilter) {
      query = query.eq('series_name', seriesFilter)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ posts: [], note: 'Blog posts table not created yet. Run migrations/extensions/003_blog_publishing_tables.sql' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts: data || [] })
  } catch {
    return NextResponse.json({ posts: [], note: 'Could not query blog posts.' })
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    title?: string
    content?: string
    excerpt?: string
    slug?: string
    coverImageUrl?: string
    platforms?: string[]
    seoTitle?: string
    seoDescription?: string
    tags?: string[]
    seriesName?: string
    scheduledAt?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { title, content, excerpt, slug, coverImageUrl, platforms, seoTitle, seoDescription, tags, seriesName, scheduledAt } = body

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const validPlatforms = (platforms || []).filter(p => BLOG_PLATFORMS.includes(p as BlogPlatform))
  const status = scheduledAt ? 'scheduled' : 'draft'

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('blog_posts')
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: content || '',
        excerpt: excerpt || null,
        slug: slug || generateSlug(title),
        cover_image_url: coverImageUrl || null,
        status,
        platforms: validPlatforms,
        published_urls: {},
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        tags: tags || [],
        series_name: seriesName || null,
        scheduled_at: scheduledAt || null,
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'Blog posts table not created yet. Run migrations/extensions/003_blog_publishing_tables.sql' }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data })
  } catch (err) {
    return NextResponse.json({ error: `Failed to create blog post: ${(err as Error).message}` }, { status: 500 })
  }
}
