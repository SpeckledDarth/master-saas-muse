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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const admin = await isAdmin(adminClient, user.id)

    const { searchParams } = new URL(request.url)
    const activityType = searchParams.get('activity_type')
    const isCompleted = searchParams.get('is_completed')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = adminClient
      .from('activities')
      .select('*', { count: 'exact' })

    if (!admin) {
      query = query.eq('user_id', user.id)
    } else {
      const userId = searchParams.get('user_id')
      if (userId) {
        query = query.eq('user_id', userId)
      }
    }

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
    console.error('[Activities GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const admin = await isAdmin(adminClient, user.id)
    const body = await request.json()

    const { activity_type, subject, body: activityBody, related_entity_type, related_entity_id, due_date, user_id } = body

    if (!activity_type) {
      return NextResponse.json({ error: 'activity_type is required' }, { status: 400 })
    }

    const targetUserId = (admin && user_id) ? user_id : user.id

    const insertData: any = {
      user_id: targetUserId,
      performed_by: user.id,
      activity_type,
      subject: subject || null,
      body: activityBody || null,
      related_entity_type: related_entity_type || null,
      related_entity_id: related_entity_id || null,
      due_date: due_date || null,
    }

    const { data, error } = await adminClient
      .from('activities')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      if (error.message?.includes('Could not find') || error.code === '42P01') {
        return NextResponse.json({ error: 'Activities table not yet created. Run migration 011.' }, { status: 503 })
      }
      throw error
    }

    return NextResponse.json({ activity: data }, { status: 201 })
  } catch (error: any) {
    console.error('[Activities POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
