import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin(supabase: any, admin: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userRole } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (userRole?.role !== 'admin') return null
  return user
}

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const user = await requireAdmin(supabase, admin)
    if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { data, error } = await admin
      .from('affiliate_network_settings')
      .select('*')
      .order('network_name')

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ networks: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ networks: data || [] })
  } catch (err) {
    console.error('Networks GET error:', err)
    return NextResponse.json({ error: 'Failed to load networks' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const user = await requireAdmin(supabase, admin)
    if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Network ID required' }, { status: 400 })

    const { error } = await admin
      .from('affiliate_network_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Networks PUT error:', err)
    return NextResponse.json({ error: 'Failed to update network' }, { status: 500 })
  }
}
