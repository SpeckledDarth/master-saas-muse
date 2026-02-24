import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('affiliate_tax_info')
      .select('id, affiliate_user_id, legal_name, tax_id_type, tax_id_last4, address_line1, address_city, address_state, address_zip, address_country, form_type, submitted_at, verified, verified_at, created_at, updated_at')
      .eq('affiliate_user_id', user.id)
      .maybeSingle()

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        return NextResponse.json({ taxInfo: null })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ taxInfo: data })
  } catch (err) {
    console.error('Tax info GET error:', err)
    return NextResponse.json({ error: 'Failed to load tax info' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { legal_name, tax_id_type, tax_id_last4, tax_id_encrypted, address_line1, address_city, address_state, address_zip, address_country, form_type } = body

    if (!legal_name) {
      return NextResponse.json({ error: 'Legal name is required' }, { status: 400 })
    }
    if (!form_type || !['w9', 'w8ben'].includes(form_type)) {
      return NextResponse.json({ error: 'Valid form type (w9 or w8ben) is required' }, { status: 400 })
    }
    if (form_type === 'w9' && !tax_id_last4) {
      return NextResponse.json({ error: 'Last 4 digits of tax ID required for W-9' }, { status: 400 })
    }

    const admin = createAdminClient()

    const record: Record<string, any> = {
      affiliate_user_id: user.id,
      legal_name,
      tax_id_type: tax_id_type || 'ssn',
      tax_id_last4: tax_id_last4 || null,
      tax_id_encrypted: tax_id_encrypted || null,
      address_line1: address_line1 || null,
      address_city: address_city || null,
      address_state: address_state || null,
      address_zip: address_zip || null,
      address_country: address_country || 'US',
      form_type,
      submitted_at: new Date().toISOString(),
      verified: false,
      verified_at: null,
    }

    const { data: existing } = await admin
      .from('affiliate_tax_info')
      .select('id')
      .eq('affiliate_user_id', user.id)
      .maybeSingle()

    let result
    if (existing) {
      const { data, error } = await admin
        .from('affiliate_tax_info')
        .update({ ...record, updated_at: new Date().toISOString() })
        .eq('affiliate_user_id', user.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      result = data
    } else {
      const { data, error } = await admin
        .from('affiliate_tax_info')
        .insert(record)
        .select()
        .single()

      if (error) {
        if (error.code === '42703') {
          const minimalRecord: Record<string, any> = {
            affiliate_user_id: user.id,
            legal_name,
            form_type,
            tax_id_type: tax_id_type || 'ssn',
            tax_id_last4: tax_id_last4 || null,
          }
          const { data: d2, error: e2 } = await admin
            .from('affiliate_tax_info')
            .insert(minimalRecord)
            .select()
            .single()
          if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
          result = d2
        } else {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      } else {
        result = data
      }
    }

    return NextResponse.json({ taxInfo: result })
  } catch (err) {
    console.error('Tax info POST error:', err)
    return NextResponse.json({ error: 'Failed to save tax info' }, { status: 500 })
  }
}
