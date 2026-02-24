import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateWebhookSecret, WEBHOOK_EVENTS } from '@/lib/affiliate/webhooks'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('affiliate_webhooks')
      .select('id, affiliate_user_id, url, events, is_active, last_triggered_at, failure_count, created_at, updated_at')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) return NextResponse.json({ webhooks: [] })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ webhooks: data || [] })
  } catch (err) {
    console.error('Webhooks GET error:', err)
    return NextResponse.json({ error: 'Failed to load webhooks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { url, events } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 })
    }

    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
      return NextResponse.json({ error: 'Webhook URL must use HTTPS' }, { status: 400 })
    }

    const selectedEvents = Array.isArray(events) && events.length > 0
      ? events.filter((e: string) => WEBHOOK_EVENTS.includes(e as any))
      : ['affiliate.commission', 'affiliate.payout']

    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('affiliate_webhooks')
      .select('id')
      .eq('affiliate_user_id', user.id)

    if (existing && existing.length >= 5) {
      return NextResponse.json({ error: 'Maximum of 5 webhooks allowed' }, { status: 400 })
    }

    const secret = generateWebhookSecret()

    const record: Record<string, any> = {
      affiliate_user_id: user.id,
      url,
      secret,
      events: selectedEvents,
      is_active: true,
      failure_count: 0,
    }

    const { data: webhook, error } = await admin
      .from('affiliate_webhooks')
      .insert(record)
      .select('id, affiliate_user_id, url, events, is_active, last_triggered_at, failure_count, created_at, updated_at')
      .single()

    if (error) {
      if (error.code === '42703') {
        const minimalRecord: Record<string, any> = {
          affiliate_user_id: user.id,
          url,
          secret,
          events: selectedEvents,
        }
        const { data: d2, error: e2 } = await admin
          .from('affiliate_webhooks')
          .insert(minimalRecord)
          .select('id, affiliate_user_id, url, events, is_active, last_triggered_at, failure_count, created_at, updated_at')
          .single()
        if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
        return NextResponse.json({ webhook: d2, secret })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ webhook, secret })
  } catch (err) {
    console.error('Webhooks POST error:', err)
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 })
  }
}
