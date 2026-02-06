import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()

    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: teamMember } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const canView = userRole?.role === 'admin' || teamMember?.role === 'owner' || teamMember?.role === 'manager'
    if (!canView) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const offset = (page - 1) * limit

    let query = adminClient
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (action) query = query.eq('action', action)
    if (userId) query = query.eq('user_id', userId)

    const { data: logs, count, error } = await query

    if (error) {
      console.error('Audit logs error:', error)
      return NextResponse.json({ logs: [], total: 0, page, totalPages: 0 })
    }

    const userIds = [...new Set((logs || []).map(l => l.user_id).filter(Boolean))]
    const userMap: Record<string, string> = {}
    for (const uid of userIds) {
      try {
        const { data } = await adminClient.auth.admin.getUserById(uid)
        if (data?.user?.email) userMap[uid] = data.user.email
      } catch {}
    }

    const enrichedLogs = (logs || []).map(log => ({
      ...log,
      userEmail: userMap[log.user_id] || 'Unknown',
    }))

    const total = count || 0
    return NextResponse.json({
      logs: enrichedLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Audit logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
