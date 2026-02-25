import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function isAdmin(adminClient: any, userId: string): Promise<boolean> {
  const { data: userRole } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
  if (userRole?.role === 'admin') return true

  const { data: teamMember } = await adminClient
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', 1)
    .maybeSingle()
  return teamMember?.role === 'owner' || teamMember?.role === 'manager'
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const adminClient = createAdminClient()
    const admin = await isAdmin(adminClient, user.id)

    const { data: existing, error: fetchError } = await adminClient
      .from('activities')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if (!admin && existing.performed_by !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const updates: any = { updated_at: new Date().toISOString() }

    if (body.is_completed !== undefined) updates.is_completed = body.is_completed
    if (body.body !== undefined) updates.body = body.body
    if (body.subject !== undefined) updates.subject = body.subject
    if (body.due_date !== undefined) updates.due_date = body.due_date

    const { data, error } = await adminClient
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ activity: data })
  } catch (error: any) {
    console.error('[Activities PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const adminClient = createAdminClient()
    const admin = await isAdmin(adminClient, user.id)

    const { data: existing, error: fetchError } = await adminClient
      .from('activities')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if (!admin && existing.performed_by !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { error } = await adminClient
      .from('activities')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Activities DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
