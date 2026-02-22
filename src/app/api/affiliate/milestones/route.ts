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
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'

    const admin = createAdminClient()

    if (isAdmin) {
      const auth = await requireAdmin()
      if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

      const { data, error } = await admin
        .from('affiliate_milestones')
        .select('*')
        .order('referral_threshold', { ascending: true })

      if (error) {
        if (error.code === '42P01') return NextResponse.json({ milestones: [], note: 'Table not created yet' })
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ milestones: data || [] })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [milestonesRes, awardsRes, linkRes] = await Promise.all([
      admin.from('affiliate_milestones').select('*').eq('is_active', true).order('referral_threshold', { ascending: true }),
      admin.from('affiliate_milestone_awards').select('*').eq('affiliate_user_id', user.id),
      admin.from('referral_links').select('signups').eq('user_id', user.id).maybeSingle(),
    ])

    if (milestonesRes.error?.code === '42P01') {
      return NextResponse.json({ milestones: [], awards: [], currentReferrals: 0 })
    }

    const milestones = milestonesRes.data || []
    const awards = awardsRes.data || []
    const currentReferrals = linkRes.data?.signups || 0

    const awardedIds = new Set(awards.map((a: any) => a.milestone_id))

    const enriched = milestones.map((m: any) => ({
      ...m,
      awarded: awardedIds.has(m.id),
      progress: Math.min(currentReferrals / m.referral_threshold, 1),
      referralsNeeded: Math.max(0, m.referral_threshold - currentReferrals),
    }))

    return NextResponse.json({
      milestones: enriched,
      currentReferrals,
      totalBonusEarned: awards.reduce((sum: number, a: any) => sum + a.bonus_amount_cents, 0),
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ milestones: [], awards: [], currentReferrals: 0 })
    }
    console.error('Milestones GET error:', err)
    return NextResponse.json({ error: 'Failed to load milestones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { name, referral_threshold, bonus_amount_cents, description, is_active, sort_order } = body

    if (!name || !referral_threshold || !bonus_amount_cents) {
      return NextResponse.json({ error: 'Name, referral threshold, and bonus amount are required' }, { status: 400 })
    }

    const { data, error } = await auth.admin
      .from('affiliate_milestones')
      .insert({
        name,
        referral_threshold,
        bonus_amount_cents,
        description: description || null,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Milestones table not created yet. Run migration 007.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ milestone: data })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Milestones table not created yet. Run migration 007.' }, { status: 503 })
    }
    console.error('Milestones POST error:', err)
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const { error } = await auth.admin
      .from('affiliate_milestones')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Milestones table not created yet. Run migration 007.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Milestones table not created yet. Run migration 007.' }, { status: 503 })
    }
    console.error('Milestones PUT error:', err)
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const { error } = await auth.admin
      .from('affiliate_milestones')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Milestones table not created yet. Run migration 007.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Milestones table not created yet. Run migration 007.' }, { status: 503 })
    }
    console.error('Milestones DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 })
  }
}
