import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('affiliate_tiers')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ tiers: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tiers: data || [] })
  } catch (err) {
    console.error('Affiliate tiers GET error:', err)
    return NextResponse.json({ error: 'Failed to load tiers' }, { status: 500 })
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
    const { name, min_referrals, commission_rate, sort_order } = body

    if (!name || commission_rate === undefined) {
      return NextResponse.json({ error: 'Name and commission rate required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('affiliate_tiers')
      .insert({ name, min_referrals: min_referrals || 0, commission_rate, sort_order: sort_order || 0 })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ tier: data })
  } catch (err) {
    console.error('Affiliate tiers POST error:', err)
    return NextResponse.json({ error: 'Failed to create tier' }, { status: 500 })
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
    const { id, name, min_referrals, commission_rate, sort_order } = body

    if (!id) return NextResponse.json({ error: 'Tier ID required' }, { status: 400 })

    const updates: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (min_referrals !== undefined) updates.min_referrals = min_referrals
    if (commission_rate !== undefined) updates.commission_rate = commission_rate
    if (sort_order !== undefined) updates.sort_order = sort_order

    const { error } = await admin.from('affiliate_tiers').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Affiliate tiers PUT error:', err)
    return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Tier ID required' }, { status: 400 })

    const { error } = await admin.from('affiliate_tiers').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Affiliate tiers DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete tier' }, { status: 500 })
  }
}
