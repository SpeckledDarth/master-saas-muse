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
      .from('user_email_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ preferences: getDefaultPreferences() })
      }
      throw error
    }

    return NextResponse.json({ preferences: data || getDefaultPreferences() })
  } catch (err) {
    console.error('Email preferences GET error:', err)
    return NextResponse.json({ preferences: getDefaultPreferences() })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const admin = createAdminClient()

    const prefData = {
      user_id: user.id,
      marketing_emails: body.marketing_emails ?? true,
      product_updates: body.product_updates ?? true,
      billing_alerts: body.billing_alerts ?? true,
      security_alerts: body.security_alerts ?? true,
      weekly_digest: body.weekly_digest ?? false,
      monthly_report: body.monthly_report ?? true,
      affiliate_updates: body.affiliate_updates ?? true,
      support_responses: body.support_responses ?? true,
      updated_at: new Date().toISOString(),
    }

    try {
      const { data: existing } = await admin
        .from('user_email_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        const { error } = await admin
          .from('user_email_preferences')
          .update(prefData)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await admin
          .from('user_email_preferences')
          .insert({ ...prefData, created_at: new Date().toISOString() })
        if (error) throw error
      }

      return NextResponse.json({ success: true })
    } catch (err: any) {
      if (err?.code === '42P01') {
        return NextResponse.json({ success: true, note: 'Table not yet created' })
      }
      throw err
    }
  } catch (err) {
    console.error('Email preferences POST error:', err)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}

function getDefaultPreferences() {
  return {
    marketing_emails: true,
    product_updates: true,
    billing_alerts: true,
    security_alerts: true,
    weekly_digest: false,
    monthly_report: true,
    affiliate_updates: true,
    support_responses: true,
  }
}
