import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// notifications table schema:
// id (uuid, default gen_random_uuid()), user_id (uuid), title (text), message (text),
// type (text, default 'info'), read (boolean, default false), link (text nullable),
// created_at (timestamptz, default now())

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        return NextResponse.json({ notifications: [], unreadCount: 0 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const safeNotifications = (data || []).map((n: any) => ({
      id: String(n.id ?? ''),
      title: String(n.title ?? ''),
      message: String(n.message ?? ''),
      type: String(n.type ?? 'info'),
      read: Boolean(n.read),
      link: n.link != null ? String(n.link) : undefined,
      created_at: String(n.created_at ?? ''),
    }))

    const unreadCount = safeNotifications.filter((n: any) => !n.read).length
    return NextResponse.json({ notifications: safeNotifications, unreadCount })
  } catch (err: any) {
    console.error('Notifications GET error:', err)
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const { data: userRole } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (userRole?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { userId, title, message, type, link } = body

  if (!userId || !title || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await adminClient.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type: type || 'info',
    link: link || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const adminClient = createAdminClient()

    if (body.markAll) {
      const { error } = await adminClient.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
      if (error && error.code === '42P01') return NextResponse.json({ success: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else if (body.id) {
      const { error } = await adminClient.from('notifications').update({ read: true }).eq('id', body.id).eq('user_id', user.id)
      if (error && error.code === '42P01') return NextResponse.json({ success: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}
