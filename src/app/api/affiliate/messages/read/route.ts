import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('affiliate_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('affiliate_user_id', user.id)
      .eq('sender_role', 'admin')
      .eq('is_read', false)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        return NextResponse.json({ success: true })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ success: true })
    }
    console.error('Messages read PATCH error:', err)
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
  }
}
