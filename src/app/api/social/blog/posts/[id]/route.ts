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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'Blog posts table not created yet. Run migrations/extensions/003_blog_publishing_tables.sql' }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
    }

    return NextResponse.json({ post: data })
  } catch (err) {
    return NextResponse.json({ error: `Failed to fetch blog post: ${(err as Error).message}` }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const allowedFields = ['title', 'content', 'excerpt', 'slug', 'cover_image_url', 'status', 'platforms', 'seo_title', 'seo_description', 'tags', 'series_name', 'scheduled_at']
  const updates: Record<string, unknown> = {}

  for (const field of allowedFields) {
    const camelKey = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    if (body[camelKey] !== undefined) {
      updates[field] = body[camelKey]
    } else if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
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
    return NextResponse.json({ error: `Failed to update blog post: ${(err as Error).message}` }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('blog_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'Blog posts table not created yet. Run migrations/extensions/003_blog_publishing_tables.sql' }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: `Failed to delete blog post: ${(err as Error).message}` }, { status: 500 })
  }
}
