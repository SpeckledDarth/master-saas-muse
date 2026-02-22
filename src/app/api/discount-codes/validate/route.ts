import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.toUpperCase().trim()

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('discount_codes')
      .select('id, code, discount_type, discount_value, duration, duration_months, max_uses, total_uses, max_uses_per_user, min_plan, expires_at, status')
      .eq('code', code)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ valid: false, error: 'Discount codes not available' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired code' })
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This code has expired' })
    }

    if (data.max_uses && data.total_uses >= data.max_uses) {
      return NextResponse.json({ valid: false, error: 'This code has reached its usage limit' })
    }

    const discountLabel = data.discount_type === 'percentage'
      ? `${data.discount_value}% off`
      : `$${(data.discount_value / 100).toFixed(2)} off`

    const durationLabel = data.duration === 'once'
      ? 'first payment'
      : data.duration === 'forever'
        ? 'all payments'
        : `${data.duration_months} months`

    return NextResponse.json({
      valid: true,
      discount: {
        code: data.code,
        type: data.discount_type,
        value: data.discount_value,
        label: discountLabel,
        duration: data.duration,
        durationLabel,
      },
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ valid: false, error: 'Discount codes not available' })
    }
    console.error('Discount code validate error:', err)
    return NextResponse.json({ error: 'Failed to validate code' }, { status: 500 })
  }
}
