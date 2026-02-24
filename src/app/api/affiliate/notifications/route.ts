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

    const unreadCount = (notifications || []).filter(n => !n.read).length

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount,
    })
  } catch {
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}
