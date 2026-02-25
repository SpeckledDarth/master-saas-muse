import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function isAdmin(admin: any, userId: string): Promise<boolean> {
  const { data: userRole } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (userRole?.role === 'admin') return true

  const { data: teamMember } = await admin
    .from('team_members')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['admin', 'owner'])
    .maybeSingle()

  return !!teamMember
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: ticket, error } = await admin
      .from('tickets')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const isOwner = ticket.user_id === user.id
    if (!isOwner) {
      const adminAccess = await isAdmin(admin, user.id)
      if (!adminAccess) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    let comments: any[] = []
    try {
      const commentQuery = admin
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })

      if (!isOwner) {
        const { data: allComments } = await commentQuery
        comments = allComments || []
      } else {
        const { data: publicComments } = await commentQuery.eq('is_internal', false)
        comments = publicComments || []
      }
    } catch {}

    return NextResponse.json({ ticket, comments })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
    }
    console.error('Ticket GET error:', err)
    return NextResponse.json({ error: 'Failed to load ticket' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: ticket, error: fetchErr } = await admin
      .from('tickets')
      .select('user_id')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr) {
      if (fetchErr.code === '42P01') return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const adminAccess = await isAdmin(admin, user.id)
    const isOwner = ticket.user_id === user.id

    if (!isOwner && !adminAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (body.status) {
      updates.status = body.status
      if (body.status === 'resolved') updates.resolved_at = new Date().toISOString()
      if (body.status === 'closed') updates.closed_at = new Date().toISOString()
    }
    if (body.priority && adminAccess) updates.priority = body.priority
    if (body.assigned_to !== undefined && adminAccess) updates.assigned_to = body.assigned_to

    const { data: updated, error: updateErr } = await admin
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) {
      if (updateErr.message?.includes('column')) {
        const { status: s, ...safeUpdates } = updates
        if (body.status) safeUpdates.status = body.status
        const { data: retryData, error: retryErr } = await admin
          .from('tickets')
          .update(safeUpdates)
          .eq('id', id)
          .select()
          .single()
        if (retryErr) return NextResponse.json({ error: retryErr.message }, { status: 500 })
        return NextResponse.json({ ticket: retryData })
      }
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ ticket: updated })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
    }
    console.error('Ticket PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
