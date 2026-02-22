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

  if (userRole?.role !== 'admin') return null
  return { user, admin }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { data, error } = await auth.admin
      .from('affiliate_payout_batches')
      .select('*')
      .order('batch_date', { ascending: false })

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ batches: [], note: 'Table not created yet' })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ batches: data || [] })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ batches: [], note: 'Table not created yet' })
    }
    console.error('Payout batches GET error:', err)
    return NextResponse.json({ error: 'Failed to load payout batches' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { action } = body

    if (action === 'generate') {
      const { data: settings } = await auth.admin
        .from('affiliate_program_settings')
        .select('min_payout_cents')
        .maybeSingle()

      const globalMinPayout = settings?.min_payout_cents ?? 5000

      const { data: affiliates, error: affErr } = await auth.admin
        .from('referral_links')
        .select('user_id, pending_earnings_cents, tier_id')
        .eq('is_affiliate', true)
        .gt('pending_earnings_cents', 0)

      if (affErr) {
        if (affErr.code === '42P01') return NextResponse.json({ error: 'referral_links table not created yet' }, { status: 503 })
        return NextResponse.json({ error: affErr.message }, { status: 500 })
      }

      if (!affiliates || affiliates.length === 0) {
        return NextResponse.json({ error: 'No affiliates with pending earnings' }, { status: 400 })
      }

      let tiers: any[] = []
      const { data: tierData, error: tierErr } = await auth.admin
        .from('affiliate_tiers')
        .select('id, min_payout_cents')

      if (!tierErr && tierData) {
        tiers = tierData
      }

      const tierMinPayoutMap = new Map<string, number>()
      for (const tier of tiers) {
        if (tier.min_payout_cents !== null && tier.min_payout_cents !== undefined) {
          tierMinPayoutMap.set(tier.id, tier.min_payout_cents)
        }
      }

      const eligible = affiliates.filter((a: any) => {
        const minPayout = (a.tier_id && tierMinPayoutMap.has(a.tier_id))
          ? tierMinPayoutMap.get(a.tier_id)!
          : globalMinPayout
        return a.pending_earnings_cents >= minPayout
      })

      if (eligible.length === 0) {
        return NextResponse.json({ error: 'No affiliates meet minimum payout threshold' }, { status: 400 })
      }

      const totalCents = eligible.reduce((sum: number, a: any) => sum + a.pending_earnings_cents, 0)

      const { data: batch, error: batchErr } = await auth.admin
        .from('affiliate_payout_batches')
        .insert({
          batch_date: new Date().toISOString(),
          status: 'pending',
          total_amount_cents: totalCents,
          total_affiliates: eligible.length,
          created_by: auth.user.id,
          notes: body.notes || null,
        })
        .select()
        .single()

      if (batchErr) {
        if (batchErr.code === '42P01') return NextResponse.json({ error: 'affiliate_payout_batches table not created yet' }, { status: 503 })
        return NextResponse.json({ error: batchErr.message }, { status: 500 })
      }

      const payoutRows = eligible.map((a: any) => ({
        batch_id: batch.id,
        affiliate_user_id: a.user_id,
        amount_cents: a.pending_earnings_cents,
        status: 'pending',
        method: 'batch',
      }))

      const { error: payoutsErr } = await auth.admin
        .from('affiliate_payouts')
        .insert(payoutRows)

      if (payoutsErr) {
        if (payoutsErr.code === '42P01') {
          await auth.admin.from('affiliate_payout_batches').delete().eq('id', batch.id)
          return NextResponse.json({ error: 'affiliate_payouts table not created yet' }, { status: 503 })
        }
        return NextResponse.json({ error: payoutsErr.message }, { status: 500 })
      }

      return NextResponse.json({
        batch,
        affiliates_included: eligible.length,
        total_amount_cents: totalCents,
      })
    }

    if (action === 'approve') {
      const { batch_id, status: newStatus } = body

      if (!batch_id || !newStatus) {
        return NextResponse.json({ error: 'batch_id and status are required' }, { status: 400 })
      }

      if (!['approved', 'rejected'].includes(newStatus)) {
        return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 })
      }

      const { error: batchUpdateErr } = await auth.admin
        .from('affiliate_payout_batches')
        .update({
          status: newStatus,
          approved_by: auth.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', batch_id)

      if (batchUpdateErr) {
        if (batchUpdateErr.code === '42P01') return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
        return NextResponse.json({ error: batchUpdateErr.message }, { status: 500 })
      }

      if (newStatus === 'approved') {
        const { error: payoutUpdateErr } = await auth.admin
          .from('affiliate_payouts')
          .update({ status: 'approved' })
          .eq('batch_id', batch_id)
          .eq('status', 'pending')

        if (payoutUpdateErr && payoutUpdateErr.code !== '42P01') {
          return NextResponse.json({ error: payoutUpdateErr.message }, { status: 500 })
        }
      }

      if (newStatus === 'rejected') {
        const { error: payoutRejectErr } = await auth.admin
          .from('affiliate_payouts')
          .update({ status: 'rejected' })
          .eq('batch_id', batch_id)
          .eq('status', 'pending')

        if (payoutRejectErr && payoutRejectErr.code !== '42P01') {
          return NextResponse.json({ error: payoutRejectErr.message }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true, status: newStatus })
    }

    return NextResponse.json({ error: 'Invalid action. Use "generate" or "approve"' }, { status: 400 })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Required tables not created yet' }, { status: 503 })
    }
    console.error('Payout batches POST error:', err)
    return NextResponse.json({ error: 'Failed to process payout batch' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { id, status, notes } = body

    if (!id) return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 })

    const updates: any = {}
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes

    const { error } = await auth.admin
      .from('affiliate_payout_batches')
      .update(updates)
      .eq('id', id)

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
    }
    console.error('Payout batches PUT error:', err)
    return NextResponse.json({ error: 'Failed to update payout batch' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 })

    const { data: batch, error: fetchErr } = await auth.admin
      .from('affiliate_payout_batches')
      .select('status')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr) {
      if (fetchErr.code === '42P01') return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

    if (batch.status !== 'pending') {
      return NextResponse.json({ error: 'Can only delete pending batches' }, { status: 400 })
    }

    const { error: deletePayoutsErr } = await auth.admin
      .from('affiliate_payouts')
      .delete()
      .eq('batch_id', id)

    if (deletePayoutsErr && deletePayoutsErr.code !== '42P01') {
      return NextResponse.json({ error: deletePayoutsErr.message }, { status: 500 })
    }

    const { error: deleteBatchErr } = await auth.admin
      .from('affiliate_payout_batches')
      .delete()
      .eq('id', id)

    if (deleteBatchErr) {
      if (deleteBatchErr.code === '42P01') return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
      return NextResponse.json({ error: deleteBatchErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Table not created yet' }, { status: 503 })
    }
    console.error('Payout batches DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete payout batch' }, { status: 500 })
  }
}
