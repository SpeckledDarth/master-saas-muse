import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { logAuditEvent } from '@/lib/affiliate/audit'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: userRole } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (userRole?.role !== 'admin') return null
  return { user, admin }
}

async function insertBroadcast(admin: any, fields: Record<string, any>) {
  const { data, error } = await admin
    .from('affiliate_broadcasts')
    .insert(fields)
    .select()
    .single()

  if (error) {
    if (error.message?.includes('sent_by') || error.message?.includes('column')) {
      const { sent_by, ...withoutSentBy } = fields
      const retry = await admin
        .from('affiliate_broadcasts')
        .insert(withoutSentBy)
        .select()
        .single()
      if (retry.error) throw retry.error
      return retry.data
    }
    throw error
  }
  return data
}

async function updateBroadcast(admin: any, id: string, updates: Record<string, any>) {
  const { error } = await admin
    .from('affiliate_broadcasts')
    .update(updates)
    .eq('id', id)

  if (error) {
    if (error.message?.includes('column') || error.code === '42703') {
      const coreFields = ['status', 'subject', 'body', 'audience_filter']
      const minimal: Record<string, any> = {}
      for (const key of coreFields) {
        if (key in updates) minimal[key] = updates[key]
      }
      if (Object.keys(minimal).length > 0) {
        const retry = await admin
          .from('affiliate_broadcasts')
          .update(minimal)
          .eq('id', id)
        if (retry.error) throw retry.error
        return
      }
    }
    throw error
  }
}

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { data, error } = await auth.admin
      .from('affiliate_broadcasts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ broadcasts: [], note: 'Table not created yet' })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ broadcasts: data || [] })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ broadcasts: [], note: 'Table not created yet' })
    }
    console.error('Broadcasts GET error:', err)
    return NextResponse.json({ error: 'Failed to load broadcasts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { subject, body: messageBody, audience_filter } = body

    if (!subject || !messageBody) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    const data = await insertBroadcast(auth.admin, {
      subject,
      body: messageBody,
      audience_filter: audience_filter || { type: 'all' },
      status: 'draft',
      sent_by: auth.user.id,
    })

    logAuditEvent({ admin_user_id: auth.user.id, admin_email: auth.user.email!, action: 'create', entity_type: 'broadcast', entity_id: data.id, entity_name: subject, details: { audience_filter: audience_filter || { type: 'all' } } })

    return NextResponse.json({ broadcast: data })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Broadcasts table not created yet. Run migration 007.' }, { status: 503 })
    }
    console.error('Broadcasts POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create broadcast' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { id, subject, body: messageBody, audience_filter, send } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const { data: existing } = await auth.admin
      .from('affiliate_broadcasts')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
    }

    if (existing.status === 'sent') {
      return NextResponse.json({ error: 'Cannot edit a sent broadcast' }, { status: 400 })
    }

    if (send) {
      let affiliateQuery = auth.admin
        .from('referral_links')
        .select('user_id')
        .eq('is_affiliate', true)

      const { data: affiliateLinks } = await affiliateQuery
      const affiliateIds = (affiliateLinks || []).map((a: any) => a.user_id)

      let sentCount = 0
      for (const userId of affiliateIds) {
        try {
          const { data: userData } = await auth.admin.auth.admin.getUserById(userId)
          if (!userData?.user?.email) continue

          await sendEmail({
            to: userData.user.email,
            subject: existing.subject,
            html: existing.body,
          })
          sentCount++
        } catch (err) {
          console.error(`Failed to send broadcast to ${userId}:`, err)
        }
      }

      await updateBroadcast(auth.admin, id, {
        status: 'sent',
        sent_count: sentCount,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      logAuditEvent({ admin_user_id: auth.user.id, admin_email: auth.user.email!, action: 'send', entity_type: 'broadcast', entity_id: id, entity_name: existing.subject, details: { sent_count: sentCount } })

      return NextResponse.json({ success: true, sent_count: sentCount })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (subject !== undefined) updates.subject = subject
    if (messageBody !== undefined) updates.body = messageBody
    if (audience_filter !== undefined) updates.audience_filter = audience_filter

    await updateBroadcast(auth.admin, id, updates)

    logAuditEvent({ admin_user_id: auth.user.id, admin_email: auth.user.email!, action: 'update', entity_type: 'broadcast', entity_id: id, entity_name: subject || existing.subject, details: updates })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Broadcasts table not created yet. Run migration 007.' }, { status: 503 })
    }
    console.error('Broadcasts PATCH error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update broadcast' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const { error } = await auth.admin
      .from('affiliate_broadcasts')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Broadcasts table not created yet. Run migration 007.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logAuditEvent({ admin_user_id: auth.user.id, admin_email: auth.user.email!, action: 'delete', entity_type: 'broadcast', entity_id: id })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Broadcasts table not created yet. Run migration 007.' }, { status: 503 })
    }
    console.error('Broadcasts DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete broadcast' }, { status: 500 })
  }
}
