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
    const { id: ticketId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: ticket } = await admin
      .from('tickets')
      .select('user_id')
      .eq('id', ticketId)
      .maybeSingle()

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const isOwner = ticket.user_id === user.id
    const adminAccess = !isOwner ? await isAdmin(admin, user.id) : false

    if (!isOwner && !adminAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    let query = admin
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (isOwner && !adminAccess) {
      query = query.eq('is_internal', false)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ comments: [], note: 'Table not created yet' })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comments: data || [] })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ comments: [], note: 'Table not created yet' })
    }
    console.error('Ticket comments GET error:', err)
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: ticket } = await admin
      .from('tickets')
      .select('user_id')
      .eq('id', ticketId)
      .maybeSingle()

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const isOwner = ticket.user_id === user.id
    const adminAccess = !isOwner ? await isAdmin(admin, user.id) : false

    if (!isOwner && !adminAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { body: commentBody, is_internal } = body

    if (!commentBody) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
    }

    const insertFields: Record<string, any> = {
      ticket_id: ticketId,
      user_id: user.id,
      body: commentBody,
      is_internal: adminAccess ? (is_internal || false) : false,
    }

    const { data, error } = await admin
      .from('ticket_comments')
      .insert(insertFields)
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
      if (error.message?.includes('column')) {
        const { data: retryData, error: retryErr } = await admin
          .from('ticket_comments')
          .insert({ ticket_id: ticketId, user_id: user.id, body: commentBody })
          .select()
          .single()
        if (retryErr) return NextResponse.json({ error: retryErr.message }, { status: 500 })
        return NextResponse.json({ comment: retryData })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await admin
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    return NextResponse.json({ comment: data })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
    }
    console.error('Ticket comments POST error:', err)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
