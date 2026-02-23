import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'

    const admin = createAdminClient()

    if (isAdmin) {
      const auth = await requireAdmin()
      if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

      const { data, error } = await admin
        .from('affiliate_contests')
        .select('*')
        .order('start_date', { ascending: false })

      if (error) {
        if (error.code === '42P01') return NextResponse.json({ contests: [], note: 'Table not created yet' })
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ contests: data || [] })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await admin
      .from('affiliate_contests')
      .select('*')
      .in('status', ['active', 'upcoming'])
      .order('start_date', { ascending: true })

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ contests: [], note: 'Table not created yet' })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ contests: data || [] })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ contests: [], note: 'Table not created yet' })
    }
    console.error('Contests GET error:', err)
    return NextResponse.json({ error: 'Failed to load contests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { name, description, metric, start_date, end_date, prize_description, prize_amount_cents } = body

    if (!name || !start_date || !end_date) {
      return NextResponse.json({ error: 'Name, start_date, and end_date are required' }, { status: 400 })
    }

    const { data, error } = await auth.admin
      .from('affiliate_contests')
      .insert({
        name,
        description: description || null,
        metric: metric || 'referrals',
        start_date,
        end_date,
        prize_description: prize_description || null,
        prize_amount_cents: prize_amount_cents || 0,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Contests table not created yet. Run migration.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logAuditEvent({ admin_user_id: auth.user.id, admin_email: auth.user.email!, action: 'create', entity_type: 'contest', entity_id: data.id, entity_name: name, details: { metric: metric || 'referrals', start_date, end_date, prize_description, prize_amount_cents } })

    return NextResponse.json({ contest: data })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Contests table not created yet. Run migration.' }, { status: 503 })
    }
    console.error('Contests POST error:', err)
    return NextResponse.json({ error: 'Failed to create contest' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const allowedFields = [
      'name', 'description', 'metric', 'start_date', 'end_date',
      'prize_description', 'prize_amount_cents', 'status',
      'winner_user_id', 'winner_announced_at'
    ]
    const filtered: Record<string, any> = {}
    for (const key of allowedFields) {
      if (key in updates) filtered[key] = updates[key]
    }

    const { error } = await auth.admin
      .from('affiliate_contests')
      .update({ ...filtered, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Contests table not created yet. Run migration.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logAuditEvent({ admin_user_id: auth.user.id, admin_email: auth.user.email!, action: 'update', entity_type: 'contest', entity_id: id, entity_name: filtered.name, details: filtered })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Contests table not created yet. Run migration.' }, { status: 503 })
    }
    console.error('Contests PUT error:', err)
    return NextResponse.json({ error: 'Failed to update contest' }, { status: 500 })
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
      .from('affiliate_contests')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Contests table not created yet. Run migration.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logAuditEvent({ admin_user_id: auth.user.id, admin_email: auth.user.email!, action: 'delete', entity_type: 'contest', entity_id: id })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Contests table not created yet. Run migration.' }, { status: 503 })
    }
    console.error('Contests DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete contest' }, { status: 500 })
  }
}
