import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('affiliate_program_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ settings: null, note: 'Table not created yet' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: data })
  } catch (err) {
    console.error('Affiliate settings GET error:', err)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { commission_rate, commission_duration_months, min_payout_cents, cookie_duration_days, program_active, attribution_conflict_policy } = body

    const { data: existing } = await admin
      .from('affiliate_program_settings')
      .select('id')
      .limit(1)
      .maybeSingle()

    const updates: any = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }

    if (commission_rate !== undefined) updates.commission_rate = commission_rate
    if (commission_duration_months !== undefined) updates.commission_duration_months = commission_duration_months
    if (min_payout_cents !== undefined) updates.min_payout_cents = min_payout_cents
    if (cookie_duration_days !== undefined) updates.cookie_duration_days = cookie_duration_days
    if (program_active !== undefined) updates.program_active = program_active
    if (attribution_conflict_policy !== undefined) updates.attribution_conflict_policy = attribution_conflict_policy

    if (existing) {
      const { error } = await admin
        .from('affiliate_program_settings')
        .update(updates)
        .eq('id', existing.id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await admin
        .from('affiliate_program_settings')
        .insert({ ...updates, commission_rate: commission_rate ?? 20, commission_duration_months: commission_duration_months ?? 12, min_payout_cents: min_payout_cents ?? 5000, cookie_duration_days: cookie_duration_days ?? 30 })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Affiliate settings PUT error:', err)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
