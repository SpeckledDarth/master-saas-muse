import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, isErrorResponse, safeTableError } from '@/lib/admin-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth

    const { id } = await params

    const { data: ticket, error } = await adminClient
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      if (safeTableError(error)) return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    let comments: any[] = []
    try {
      const { data, error: cErr } = await adminClient
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })

      if (!cErr && data) comments = data
    } catch {}

    let userName = null
    if (ticket.user_id) {
      try {
        const { data: profile } = await adminClient
          .from('user_profiles')
          .select('display_name')
          .eq('user_id', ticket.user_id)
          .maybeSingle()
        if (profile?.display_name) {
          userName = profile.display_name
        } else {
          const { data: authData } = await adminClient.auth.admin.getUserById(ticket.user_id)
          if (authData?.user) {
            userName = authData.user.user_metadata?.display_name || authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || null
          }
        }
      } catch {}
    }

    return NextResponse.json({ ticket, comments, userName })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
    }
    console.error('Admin feedback detail GET error:', err)
    return NextResponse.json({ error: 'Failed to load ticket' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth

    const { id } = await params
    const body = await request.json()

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (body.status) {
      updates.status = body.status
      if (body.status === 'resolved') updates.resolved_at = new Date().toISOString()
      if (body.status === 'closed') updates.closed_at = new Date().toISOString()
    }
    if (body.priority) updates.priority = body.priority
    if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to

    const { data: updated, error } = await adminClient
      .from('support_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (safeTableError(error)) return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ticket: updated })
  } catch (err: any) {
    console.error('Admin feedback detail PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient, user } = auth

    const { id } = await params
    const body = await request.json()
    const { message, is_internal } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const { data: comment, error } = await adminClient
      .from('ticket_comments')
      .insert({
        ticket_id: id,
        user_id: user.id,
        body: message.trim(),
        is_internal: is_internal || false,
      })
      .select()
      .single()

    if (error) {
      if (safeTableError(error)) return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await adminClient
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ comment })
  } catch (err: any) {
    console.error('Admin feedback detail POST error:', err)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
