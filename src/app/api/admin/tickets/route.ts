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

  if (userRole?.role === 'admin') return { user, admin }

  const { data: teamMember } = await admin
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'owner'])
    .maybeSingle()

  if (teamMember) return { user, admin }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const assignedTo = searchParams.get('assigned_to')
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    let query = auth.admin
      .from('tickets')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)
    if (category) query = query.eq('category', category)
    if (assignedTo) query = query.eq('assigned_to', assignedTo)
    if (userId) query = query.eq('user_id', userId)

    const { data, error, count } = await query

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ tickets: [], total: 0, note: 'Table not created yet' })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tickets: data || [], total: count || 0 })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ tickets: [], total: 0, note: 'Table not created yet' })
    }
    console.error('Admin tickets GET error:', err)
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 })
  }
}
