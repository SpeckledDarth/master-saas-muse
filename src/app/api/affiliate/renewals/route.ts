import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: renewals, error } = await admin
      .from('commission_renewals')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching renewals:', error)
      return NextResponse.json({ renewals: [] })
    }

    const { data: referrals } = await admin
      .from('affiliate_referrals')
      .select('id, status, created_at, commission_end_date, health_status')
      .eq('affiliate_user_id', user.id)
      .not('status', 'eq', 'churned')

    const { data: link } = await admin
      .from('referral_links')
      .select('locked_duration_months')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: settingsRows } = await admin
      .from('affiliate_settings')
      .select('key, value')
      .in('key', ['commission_duration_months'])

    const settingsMap: Record<string, string> = {}
    ;(settingsRows || []).forEach((s: any) => { settingsMap[s.key] = s.value })
    const durationMonths = link?.locked_duration_months || parseInt(settingsMap.commission_duration_months || '12')

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const expiringReferrals = (referrals || []).filter(r => {
      let endDate: Date
      if (r.commission_end_date) {
        endDate = new Date(r.commission_end_date)
      } else {
        endDate = new Date(r.created_at)
        endDate.setMonth(endDate.getMonth() + durationMonths)
      }
      return endDate <= thirtyDaysFromNow && endDate >= now
    }).map(r => {
      let endDate: Date
      if (r.commission_end_date) {
        endDate = new Date(r.commission_end_date)
      } else {
        endDate = new Date(r.created_at)
        endDate.setMonth(endDate.getMonth() + durationMonths)
      }
      return {
        ...r,
        computed_end_date: endDate.toISOString().split('T')[0],
        days_remaining: Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }
    })

    return NextResponse.json({
      renewals: renewals || [],
      expiringReferrals,
      durationMonths,
    })
  } catch (err) {
    console.error('Renewals GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { referral_id, check_in_type, check_in_notes, original_end_date } = body

    if (!referral_id || !check_in_type || !original_end_date) {
      return NextResponse.json({ error: 'Missing required fields: referral_id, check_in_type, original_end_date' }, { status: 400 })
    }

    if (!['email', 'call', 'note'].includes(check_in_type)) {
      return NextResponse.json({ error: 'Invalid check_in_type. Must be email, call, or note.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: referral } = await admin
      .from('affiliate_referrals')
      .select('id, affiliate_user_id')
      .eq('id', referral_id)
      .eq('affiliate_user_id', user.id)
      .maybeSingle()

    if (!referral) {
      return NextResponse.json({ error: 'Referral not found or not yours' }, { status: 404 })
    }

    const { data: existingPending } = await admin
      .from('commission_renewals')
      .select('id')
      .eq('referral_id', referral_id)
      .eq('affiliate_user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingPending) {
      return NextResponse.json({ error: 'A pending renewal request already exists for this referral' }, { status: 409 })
    }

    const originalDate = new Date(original_end_date)
    const renewedDate = new Date(originalDate)
    renewedDate.setMonth(renewedDate.getMonth() + 3)

    const { data: renewal, error } = await admin
      .from('commission_renewals')
      .insert({
        affiliate_user_id: user.id,
        referral_id,
        original_end_date,
        renewed_end_date: renewedDate.toISOString().split('T')[0],
        check_in_type,
        check_in_notes: check_in_notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating renewal:', error)
      return NextResponse.json({ error: 'Failed to create renewal request' }, { status: 500 })
    }

    return NextResponse.json({ renewal })
  } catch (err) {
    console.error('Renewals POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
