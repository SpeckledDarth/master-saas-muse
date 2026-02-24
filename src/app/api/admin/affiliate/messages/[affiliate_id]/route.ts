import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/affiliate/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ affiliate_id: string }> }
) {
  try {
    const { affiliate_id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { data, error } = await admin
      .from('affiliate_messages')
      .select('*')
      .eq('affiliate_user_id', affiliate_id)
      .order('created_at', { ascending: true })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        return NextResponse.json({ messages: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await admin
      .from('affiliate_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('affiliate_user_id', affiliate_id)
      .eq('sender_role', 'affiliate')
      .eq('is_read', false)

    return NextResponse.json({ messages: data || [] })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ messages: [] })
    }
    console.error('Admin thread GET error:', err)
    return NextResponse.json({ error: 'Failed to load thread' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ affiliate_id: string }> }
) {
  try {
    const { affiliate_id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { body: messageBody } = body

    if (!messageBody || typeof messageBody !== 'string' || messageBody.trim().length === 0) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
    }

    if (messageBody.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 })
    }

    const record: Record<string, any> = {
      affiliate_user_id: affiliate_id,
      sender_id: user.id,
      sender_role: 'admin',
      body: messageBody.trim(),
      is_read: false,
    }

    const { data, error } = await admin
      .from('affiliate_messages')
      .insert(record)
      .select()
      .single()

    if (error) {
      if (error.code === '42703') {
        const minimalRecord: Record<string, any> = {
          affiliate_user_id: affiliate_id,
          sender_id: user.id,
          body: messageBody.trim(),
        }
        const { data: d2, error: e2 } = await admin
          .from('affiliate_messages')
          .insert(minimalRecord)
          .select()
          .single()
        if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })

        await logAuditEvent({
          admin_user_id: user.id,
          admin_email: user.email || undefined,
          action: 'send',
          entity_type: 'message',
          entity_id: d2?.id,
          details: { affiliate_user_id: affiliate_id },
        }).catch(() => {})

        return NextResponse.json({ message: d2 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logAuditEvent({
      admin_user_id: user.id,
      admin_email: user.email || undefined,
      action: 'send',
      entity_type: 'message',
      entity_id: data?.id,
      details: { affiliate_user_id: affiliate_id },
    }).catch(() => {})

    return NextResponse.json({ message: data })
  } catch (err) {
    console.error('Admin message POST error:', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
