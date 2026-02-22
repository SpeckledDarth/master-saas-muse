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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = auth.admin
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.ilike('code', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ codes: [], note: 'Table not created yet. Run migration 007.' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: statsData } = await auth.admin
      .from('discount_codes')
      .select('status, total_uses, total_discount_cents')

    const stats = {
      totalCodes: statsData?.length || 0,
      activeCodes: statsData?.filter((c: any) => c.status === 'active').length || 0,
      totalRedemptions: statsData?.reduce((sum: number, c: any) => sum + (c.total_uses || 0), 0) || 0,
      totalDiscountGiven: statsData?.reduce((sum: number, c: any) => sum + (c.total_discount_cents || 0), 0) || 0,
    }

    return NextResponse.json({ codes: data || [], stats })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ codes: [], note: 'Table not created yet. Run migration 007.' })
    }
    console.error('Discount codes GET error:', err)
    return NextResponse.json({ error: 'Failed to load discount codes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const {
      code, description, discount_type, discount_value, duration,
      duration_months, max_uses, max_uses_per_user, min_plan,
      stackable, expires_at, affiliate_user_id,
    } = body

    if (!code || !discount_value) {
      return NextResponse.json({ error: 'Code and discount value are required' }, { status: 400 })
    }

    const normalizedCode = code.toUpperCase().trim()

    const { data: existing } = await auth.admin
      .from('discount_codes')
      .select('id')
      .eq('code', normalizedCode)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'This code already exists' }, { status: 409 })
    }

    const { data, error } = await auth.admin
      .from('discount_codes')
      .insert({
        code: normalizedCode,
        description: description || null,
        discount_type: discount_type || 'percentage',
        discount_value,
        duration: duration || 'once',
        duration_months: duration_months || null,
        max_uses: max_uses || null,
        max_uses_per_user: max_uses_per_user ?? 1,
        min_plan: min_plan || null,
        stackable: stackable ?? false,
        expires_at: expires_at || null,
        affiliate_user_id: affiliate_user_id || null,
        status: 'active',
        created_by: auth.user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Discount codes table not created yet. Run migration 007.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ code: data })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Discount codes table not created yet. Run migration 007.' }, { status: 503 })
    }
    console.error('Discount codes POST error:', err)
    return NextResponse.json({ error: 'Failed to create discount code' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const allowedFields = [
      'description', 'discount_type', 'discount_value', 'duration',
      'duration_months', 'max_uses', 'max_uses_per_user', 'min_plan',
      'stackable', 'expires_at', 'affiliate_user_id', 'status',
    ]

    const safeUpdates: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        safeUpdates[key] = updates[key]
      }
    }

    const { error } = await auth.admin
      .from('discount_codes')
      .update(safeUpdates)
      .eq('id', id)

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Discount codes table not created yet. Run migration 007.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Discount codes table not created yet. Run migration 007.' }, { status: 503 })
    }
    console.error('Discount codes PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update discount code' }, { status: 500 })
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
      .from('discount_codes')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Discount codes table not created yet. Run migration 007.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Discount codes table not created yet. Run migration 007.' }, { status: 503 })
    }
    console.error('Discount codes DELETE error:', err)
    return NextResponse.json({ error: 'Failed to archive discount code' }, { status: 500 })
  }
}
