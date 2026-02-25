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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const adminClient = createAdminClient()
    const admin = await isAdmin(adminClient, user.id)

    const { data, error } = await adminClient
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (!admin && data.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ contract: data })
  } catch (error: any) {
    console.error('[Contract GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
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
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (!admin && existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const updates: any = { updated_at: new Date().toISOString() }

    if (!admin) {
      if (body.sign === true) {
        updates.signed_at = new Date().toISOString()
        updates.signed_by = user.id
      }
    } else {
      if (body.status !== undefined) updates.status = body.status
      if (body.title !== undefined) updates.title = body.title
      if (body.effective_date !== undefined) updates.effective_date = body.effective_date
      if (body.expiry_date !== undefined) updates.expiry_date = body.expiry_date
      if (body.metadata !== undefined) updates.metadata = body.metadata

      if (body.countersign === true) {
        updates.countersigned_at = new Date().toISOString()
        updates.countersigned_by = user.id
      }

      if (body.body !== undefined && existing.status === 'active') {
        const { data: newVersion, error: versionError } = await adminClient
          .from('contracts')
          .insert({
            user_id: existing.user_id,
            title: existing.title,
            body: body.body,
            version: existing.version + 1,
            status: existing.status,
            contract_type: existing.contract_type,
            effective_date: existing.effective_date,
            expiry_date: existing.expiry_date,
            parent_contract_id: existing.id,
          })
          .select()
          .single()

        if (versionError) throw versionError

        await adminClient
          .from('contracts')
          .update({ status: 'superseded', updated_at: new Date().toISOString() })
          .eq('id', existing.id)

        return NextResponse.json({ contract: newVersion, versioned: true })
      } else if (body.body !== undefined) {
        updates.body = body.body
      }
    }

    const { data, error } = await adminClient
      .from('contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ contract: data })
  } catch (error: any) {
    console.error('[Contract PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
