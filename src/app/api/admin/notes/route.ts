import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function verifyAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const adminClient = createAdminClient()
  const { data: userRole } = await adminClient.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
  const { data: teamMember } = await adminClient.from('organization_members').select('role').eq('user_id', user.id).eq('organization_id', 1).maybeSingle()
  const isAdmin = userRole?.role === 'admin'
  const canAccess = isAdmin || teamMember?.role === 'owner' || teamMember?.role === 'manager'
  if (!canAccess) return { error: NextResponse.json({ error: 'Access denied' }, { status: 403 }) }

  return { user, adminClient }
}

export async function POST(request: Request) {
  try {
    const result = await verifyAccess()
    if ('error' in result && result.error instanceof NextResponse) return result.error
    const { user, adminClient } = result as { user: { id: string }; adminClient: ReturnType<typeof createAdminClient> }

    const body = await request.json()
    const { userId, note } = body

    if (!userId || !note) {
      return NextResponse.json({ error: 'userId and note are required' }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from('admin_notes')
      .insert({
        user_id: userId,
        note: note,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating admin note:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ note: data })
  } catch (error) {
    console.error('Error in admin notes POST:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const result = await verifyAccess()
    if ('error' in result && result.error instanceof NextResponse) return result.error
    const { adminClient } = result as { user: { id: string }; adminClient: ReturnType<typeof createAdminClient> }

    const url = new URL(request.url)
    const noteId = url.searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json({ error: 'noteId is required' }, { status: 400 })
    }

    const { error } = await adminClient
      .from('admin_notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      console.error('Error deleting admin note:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in admin notes DELETE:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
