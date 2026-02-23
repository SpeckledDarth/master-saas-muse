import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const url = new URL(request.url)
    const entity_type = url.searchParams.get('entity_type')
    const action = url.searchParams.get('action')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = admin
      .from('affiliate_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (entity_type) query = query.eq('entity_type', entity_type)
    if (action) query = query.eq('action', action)

    const { data, error } = await query

    if (error?.code === '42P01') {
      return NextResponse.json({ entries: [], note: 'Audit log table not created yet. Run the migration.' })
    }

    if (error) throw error

    return NextResponse.json({ entries: data || [] })
  } catch (err) {
    console.error('[Audit API] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
  }
}
