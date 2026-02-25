import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: notifications, error } = await admin
      .from('notifications')
      .select('id, title, message, type, read, link, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ notifications: [], unreadCount: 0 })
    }

    const safeNotifications = (notifications || []).map((n: any) => ({
      id: String(n.id ?? ''),
      title: String(n.title ?? ''),
      message: String(n.message ?? ''),
      type: String(n.type ?? 'info'),
      read: Boolean(n.read),
      link: n.link != null ? String(n.link) : undefined,
      created_at: String(n.created_at ?? ''),
    }))

    const unreadCount = safeNotifications.filter(n => !n.read).length

    return NextResponse.json({
      notifications: safeNotifications,
      unreadCount,
    })
  } catch {
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}
