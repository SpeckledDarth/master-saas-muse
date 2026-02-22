import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const affiliateId = searchParams.get('affiliateId')

    if (affiliateId) {
      const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
      if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

      const { data } = await admin
        .from('affiliate_payouts')
        .select('*')
        .eq('affiliate_user_id', affiliateId)
        .order('created_at', { ascending: false })

      return NextResponse.json({ payouts: data || [] })
    }

    const { data } = await admin
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ payouts: data || [] })
  } catch (err) {
    console.error('Affiliate payouts GET error:', err)
    return NextResponse.json({ error: 'Failed to load payouts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { affiliate_user_id, amount_cents, method, notes } = body

    if (!affiliate_user_id || !amount_cents) {
      return NextResponse.json({ error: 'Affiliate user and amount required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('affiliate_payouts')
      .insert({ affiliate_user_id, amount_cents, method: method || 'manual', notes, status: 'pending' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ payout: data })
  } catch (err) {
    console.error('Affiliate payouts POST error:', err)
    return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { id, status, notes } = body

    if (!id || !status) return NextResponse.json({ error: 'Payout ID and status required' }, { status: 400 })

    const updates: any = { status }
    if (notes !== undefined) updates.notes = notes

    if (status === 'paid') {
      updates.processed_at = new Date().toISOString()
      updates.processed_by = user.id

      const { data: payout } = await admin
        .from('affiliate_payouts')
        .select('affiliate_user_id, amount_cents')
        .eq('id', id)
        .single()

      if (payout) {
        const rpcResult = await admin.rpc('increment_affiliate_paid', {
          p_user_id: payout.affiliate_user_id,
          p_amount: payout.amount_cents,
        })

        if (rpcResult.error) {
          const { data: link } = await admin
            .from('referral_links')
            .select('paid_earnings_cents, pending_earnings_cents')
            .eq('user_id', payout.affiliate_user_id)
            .maybeSingle()

          if (link) {
            await admin
              .from('referral_links')
              .update({
                paid_earnings_cents: (link.paid_earnings_cents || 0) + payout.amount_cents,
                pending_earnings_cents: Math.max(0, (link.pending_earnings_cents || 0) - payout.amount_cents),
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', payout.affiliate_user_id)
          }
        }

        await admin
          .from('affiliate_commissions')
          .update({ status: 'paid' })
          .eq('affiliate_user_id', payout.affiliate_user_id)
          .eq('status', 'approved')

        const { createNotification } = await import('@/lib/affiliate')
        await createNotification(
          payout.affiliate_user_id,
          'Payout Processed!',
          `Your payout of $${(payout.amount_cents / 100).toFixed(2)} has been processed.`,
          'success',
          '/dashboard/social/affiliate'
        )
      }
    }

    const { error } = await admin.from('affiliate_payouts').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Affiliate payouts PUT error:', err)
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 })
  }
}
