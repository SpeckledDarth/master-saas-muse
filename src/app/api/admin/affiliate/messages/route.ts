import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { data: messages, error } = await admin
      .from('affiliate_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        return NextResponse.json({ threads: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const threadMap: Record<string, { affiliate_user_id: string; lastMessage: string; lastMessageAt: string; unreadCount: number; totalMessages: number }> = {}
    for (const msg of messages || []) {
      const aid = msg.affiliate_user_id
      if (!threadMap[aid]) {
        threadMap[aid] = {
          affiliate_user_id: aid,
          lastMessage: msg.body,
          lastMessageAt: msg.created_at,
          unreadCount: 0,
          totalMessages: 0,
        }
      }
      threadMap[aid].totalMessages++
      if (msg.sender_role === 'affiliate' && !msg.is_read) {
        threadMap[aid].unreadCount++
      }
    }

    const affiliateIds = Object.keys(threadMap)
    let emailMap: Record<string, string> = {}
    let refCodeMap: Record<string, string> = {}
    if (affiliateIds.length > 0) {
      const { data: links } = await admin
        .from('referral_links')
        .select('user_id, ref_code')
        .in('user_id', affiliateIds)
      if (links) {
        for (const link of links) {
          refCodeMap[link.user_id] = link.ref_code
        }
      }
    }

    const threads = Object.values(threadMap).map(t => ({
      ...t,
      ref_code: refCodeMap[t.affiliate_user_id] || null,
    }))

    threads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

    return NextResponse.json({ threads })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ threads: [] })
    }
    console.error('Admin messages GET error:', err)
    return NextResponse.json({ error: 'Failed to load message threads' }, { status: 500 })
  }
}
