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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { id } = await params

    const { data: items, error } = await auth.admin
      .from('affiliate_payout_items')
      .select('*')
      .eq('payout_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ items: [], note: 'Table not created yet' })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let commissionDetails: any[] = []
    const commissionIds = (items || []).map((i: any) => i.commission_id).filter(Boolean)
    if (commissionIds.length > 0) {
      try {
        const { data: commissions } = await auth.admin
          .from('affiliate_commissions')
          .select('*')
          .in('id', commissionIds)
        if (commissions) commissionDetails = commissions
      } catch {}
    }

    const commissionMap = new Map(commissionDetails.map((c: any) => [c.id, c]))
    const enrichedItems = (items || []).map((item: any) => ({
      ...item,
      commission: commissionMap.get(item.commission_id) || null,
    }))

    return NextResponse.json({ items: enrichedItems })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ items: [], note: 'Table not created yet' })
    }
    console.error('Admin payout items GET error:', err)
    return NextResponse.json({ error: 'Failed to load payout items' }, { status: 500 })
  }
}
