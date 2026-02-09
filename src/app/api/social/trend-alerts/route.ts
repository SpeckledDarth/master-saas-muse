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

function isTableNotFoundError(error: { code?: string; message?: string }): boolean {
  return error.code === '42P01' || !!error.message?.includes('does not exist')
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100)
  const status = searchParams.get('status')

  try {
    const admin = getSupabaseAdmin()
    let query = admin
      .from('trend_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      if (isTableNotFoundError(error)) {
        return NextResponse.json({
          alerts: [],
          note: 'Trend alerts table not yet created. This feature will be available after running the trend_alerts migration.'
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ alerts: data || [] })
  } catch {
    return NextResponse.json({
      alerts: [],
      note: 'Could not query trend alerts. The table may not exist yet.'
    })
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { alertId?: string; action?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { alertId, action } = body

  if (!alertId || typeof alertId !== 'string') {
    return NextResponse.json({ error: 'alertId is required' }, { status: 400 })
  }

  if (!action || !['approve', 'edit', 'ignore'].includes(action)) {
    return NextResponse.json({ error: 'action must be one of: approve, edit, ignore' }, { status: 400 })
  }

  try {
    const admin = getSupabaseAdmin()

    const { data: alert, error: fetchError } = await admin
      .from('trend_alerts')
      .select('*')
      .eq('id', alertId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      if (isTableNotFoundError(fetchError)) {
        return NextResponse.json({
          error: 'Trend alerts table not yet created. This feature will be available after running the trend_alerts migration.'
        }, { status: 500 })
      }
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (action === 'approve') {
      const now = new Date()
      const scheduledAt = new Date(now.getTime() + 60 * 60 * 1000)

      const postData: Record<string, unknown> = {
        user_id: user.id,
        platform: alert.platform || 'twitter',
        content: alert.suggested_content || alert.trend_title || '',
        status: 'scheduled',
        scheduled_at: scheduledAt.toISOString(),
        media_urls: [],
        ai_generated: true,
        created_at: now.toISOString(),
      }

      const { data: post, error: postError } = await admin
        .from('social_posts')
        .insert(postData)
        .select('*')
        .single()

      if (postError) {
        if (isTableNotFoundError(postError)) {
          return NextResponse.json({
            error: 'Social posts table not yet created. Please run the social posts migration first.'
          }, { status: 500 })
        }
        return NextResponse.json({ error: postError.message }, { status: 500 })
      }

      await admin
        .from('trend_alerts')
        .update({ status: 'approved', acted_at: now.toISOString() })
        .eq('id', alertId)

      return NextResponse.json({
        success: true,
        action: 'approve',
        post,
        message: 'Post has been scheduled successfully.'
      })
    }

    if (action === 'ignore') {
      const { error: updateError } = await admin
        .from('trend_alerts')
        .update({ status: 'ignored', acted_at: new Date().toISOString() })
        .eq('id', alertId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        action: 'ignore',
        message: 'Alert has been dismissed.'
      })
    }

    if (action === 'edit') {
      await admin
        .from('trend_alerts')
        .update({ status: 'editing', acted_at: new Date().toISOString() })
        .eq('id', alertId)

      return NextResponse.json({
        success: true,
        action: 'edit',
        alert,
        message: 'Alert content ready for editing.',
        redirectTo: `/dashboard/social/posts?action=edit&alertId=${alertId}`
      })
    }

    return NextResponse.json({ error: 'Unhandled action' }, { status: 400 })
  } catch (err) {
    console.error('Trend alert action error:', err)
    return NextResponse.json({ error: 'Failed to process trend alert action' }, { status: 500 })
  }
}
