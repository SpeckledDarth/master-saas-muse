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
    const userId = searchParams.get('user_id')
    const activityType = searchParams.get('activity_type')
    const isCompleted = searchParams.get('is_completed')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = adminClient
      .from('activities')
      .select('*', { count: 'exact' })

    if (userId) query = query.eq('user_id', userId)
    if (activityType) query = query.eq('activity_type', activityType)
    if (isCompleted !== null && isCompleted !== undefined && isCompleted !== '') {
      query = query.eq('is_completed', isCompleted === 'true')
    }
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      if (error.message?.includes('Could not find') || error.code === '42P01') {
        return NextResponse.json({ activities: [], total: 0 })
      }
      throw error
    }

    return NextResponse.json({ activities: data || [], total: count || 0 })
  } catch (error: any) {
    console.error('[Admin Activities GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
