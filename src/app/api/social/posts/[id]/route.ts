import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { addSocialPostJob } from '@/lib/queue'

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

async function isModuleEnabled(): Promise<boolean> {
  const admin = getSupabaseAdmin()
  const { data } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
  return data?.settings?.features?.socialModuleEnabled ?? false
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const enabled = await isModuleEnabled()
  if (!enabled) {
    return NextResponse.json({ error: 'Social module is not enabled' }, { status: 403 })
  }

  const { id } = await params

  let body: { content?: string; status?: string; scheduledAt?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const admin = getSupabaseAdmin()

    const { data: existing, error: fetchError } = await admin
      .from('social_posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      if (fetchError?.code === '42P01' || fetchError?.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'Social posts table does not exist yet' }, { status: 500 })
      }
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.content !== undefined) {
      updates.content = body.content.trim()
    }
    if (body.status !== undefined) {
      updates.status = body.status
    }
    if (body.scheduledAt !== undefined) {
      updates.scheduled_at = body.scheduledAt || null
    }

    const { data, error } = await admin
      .from('social_posts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (body.status === 'scheduled' && body.scheduledAt) {
      try {
        await addSocialPostJob({
          postId: id,
          userId: user.id,
          platform: data.platform,
          content: data.content,
          mediaUrls: data.media_urls,
          scheduledAt: body.scheduledAt,
        })
      } catch (queueErr) {
        console.warn('[Social Posts] Could not enqueue post job:', (queueErr as Error).message)
      }
    }

    return NextResponse.json({ post: data })
  } catch (err) {
    return NextResponse.json({ error: 'Could not update post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const enabled = await isModuleEnabled()
  if (!enabled) {
    return NextResponse.json({ error: 'Social module is not enabled' }, { status: 403 })
  }

  const { id } = await params

  try {
    const admin = getSupabaseAdmin()

    const { data: existing, error: fetchError } = await admin
      .from('social_posts')
      .select('id, status, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      if (fetchError?.code === '42P01' || fetchError?.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'Social posts table does not exist yet' }, { status: 500 })
      }
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (existing.status === 'posted') {
      return NextResponse.json({ error: 'Cannot delete a post that has already been posted' }, { status: 400 })
    }

    const { error } = await admin
      .from('social_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Could not delete post' }, { status: 500 })
  }
}
