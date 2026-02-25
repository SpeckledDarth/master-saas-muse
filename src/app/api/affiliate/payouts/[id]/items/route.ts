import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: payout, error: payoutErr } = await admin
      .from('affiliate_payouts')
      .select('id, affiliate_user_id')
      .eq('id', id)
      .maybeSingle()

    if (payoutErr) {
      if (payoutErr.code === '42P01') return NextResponse.json({ items: [], note: 'Table not created yet' })
      return NextResponse.json({ error: payoutErr.message }, { status: 500 })
    }

    if (!payout) return NextResponse.json({ error: 'Payout not found' }, { status: 404 })

    const isOwner = payout.affiliate_user_id === user.id
    if (!isOwner) {
      const { data: userRole } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (userRole?.role !== 'admin') {
        const { data: teamMember } = await admin
          .from('team_members')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'owner'])
          .maybeSingle()

        if (!teamMember) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }
    }

    const { data: items, error: itemsErr } = await admin
      .from('affiliate_payout_items')
      .select('*')
      .eq('payout_id', id)
      .order('created_at', { ascending: false })

    if (itemsErr) {
      if (itemsErr.code === '42P01') return NextResponse.json({ items: [], note: 'Table not created yet' })
      return NextResponse.json({ error: itemsErr.message }, { status: 500 })
    }

    return NextResponse.json({ items: items || [] })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ items: [], note: 'Table not created yet' })
    }
    console.error('Payout items GET error:', err)
    return NextResponse.json({ error: 'Failed to load payout items' }, { status: 500 })
  }
}
