import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('affiliate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      profile: profile || {
        user_id: user.id,
        display_name: '',
        legal_name: '',
        phone: '',
        website: '',
        bio: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
        payout_method: 'paypal',
        payout_email: user.email || '',
        payout_bank_name: '',
        payout_bank_routing: '',
        payout_bank_account: '',
        tax_id: '',
        tour_completed: false,
      },
      email: user.email,
    })
  } catch (err) {
    console.error('Affiliate profile GET error:', err)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const admin = createAdminClient()

    const profileData: Record<string, any> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }

    const allowedFields = [
      'display_name', 'legal_name', 'phone', 'website', 'bio',
      'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
      'payout_method', 'payout_email', 'payout_bank_name', 'payout_bank_routing', 'payout_bank_account',
      'tax_id', 'tour_completed',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        profileData[field] = body[field]
      }
    }

    const { data: existing } = await admin
      .from('affiliate_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      const { error } = await admin
        .from('affiliate_profiles')
        .update(profileData)
        .eq('user_id', user.id)

      if (error) {
        console.error('Profile update error:', error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
    } else {
      profileData.created_at = new Date().toISOString()
      const { error } = await admin
        .from('affiliate_profiles')
        .insert(profileData)

      if (error) {
        console.error('Profile insert error:', error)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Affiliate profile POST error:', err)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
