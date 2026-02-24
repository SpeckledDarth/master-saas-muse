import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const admin = createAdminClient()

    const { data: codes } = await admin
      .from('affiliate_discount_codes')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: requests } = await admin
      .from('affiliate_code_requests')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      codes: codes || [],
      requests: requests || [],
    })
  } catch (err: any) {
    if (err?.code === '42P01') {
      return NextResponse.json({ codes: [], requests: [] })
    }
    console.error('Discount codes GET error:', err)
    return NextResponse.json({ error: 'Failed to load codes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json()
    const admin = createAdminClient()

    if (body.action === 'request_code') {
      const requestedCode = (body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
      if (!requestedCode || requestedCode.length < 3 || requestedCode.length > 20) {
        return NextResponse.json({ error: 'Code must be 3-20 alphanumeric characters' }, { status: 400 })
      }

      const { data: existing } = await admin
        .from('affiliate_discount_codes')
        .select('id')
        .eq('code', requestedCode)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ error: 'This code is already taken. Try another.' }, { status: 409 })
      }

      const { error } = await admin
        .from('affiliate_code_requests')
        .insert({
          affiliate_user_id: user.id,
          requested_code: requestedCode,
          requested_discount_percent: body.discount_percent || null,
          reason: body.reason || null,
          status: 'pending',
        })

      if (error) {
        console.error('Code request insert error:', error)
        return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Code request submitted for admin review' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    console.error('Discount codes POST error:', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
