import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin(adminClient: any, userId: string): Promise<boolean> {
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    if (!(await requireAdmin(adminClient, user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const createdBy = searchParams.get('created_by')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = adminClient
      .from('campaigns')
      .select('*', { count: 'exact' })

    if (status) query = query.eq('status', status)
    if (createdBy) query = query.eq('created_by', createdBy)
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      if (error.message?.includes('Could not find') || error.code === '42P01') {
        return NextResponse.json({ campaigns: [], total: 0 })
      }
      throw error
    }

    return NextResponse.json({ campaigns: data || [], total: count || 0 })
  } catch (error: any) {
    console.error('[Admin Campaigns GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
