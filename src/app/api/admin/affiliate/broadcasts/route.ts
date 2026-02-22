import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

    const { data, error } = await auth.admin
      .from('affiliate_broadcasts')
      .insert({
        subject,
        body: messageBody,
        audience_filter: audience_filter || { type: 'all' },
        status: 'draft',
        sent_by: auth.user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Broadcasts table not created yet. Run migration 007.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ broadcast: data })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Broadcasts table not created yet. Run migration 007.' }, { status: 503 })
    }
    console.error('Broadcasts POST error:', err)
    return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { id, subject, body: messageBody, audience_filter } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const { data: existing } = await auth.admin
      .from('affiliate_broadcasts')
      .select('status')
      .eq('id', id)
      .maybeSingle()

    if (existing?.status === 'sent') {
      return NextResponse.json({ error: 'Cannot edit a sent broadcast' }, { status: 400 })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (subject !== undefined) updates.subject = subject
    if (messageBody !== undefined) updates.body = messageBody
    if (audience_filter !== undefined) updates.audience_filter = audience_filter

    const { error } = await auth.admin
      .from('affiliate_broadcasts')
      .update(updates)
      .eq('id', id)

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Broadcasts table not created yet. Run migration 007.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Broadcasts table not created yet. Run migration 007.' }, { status: 503 })
    }
    console.error('Broadcasts PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update broadcast' }, { status: 500 })
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

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Broadcasts table not created yet. Run migration 007.' }, { status: 503 })
    }
    console.error('Broadcasts DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete broadcast' }, { status: 500 })
  }
}
