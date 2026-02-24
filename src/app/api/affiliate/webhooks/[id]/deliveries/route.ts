import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: webhook } = await admin
      .from('affiliate_webhooks')
      .select('id, affiliate_user_id')
      .eq('id', id)
      .eq('affiliate_user_id', user.id)
      .single()

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const { data: deliveries, error } = await admin
      .from('affiliate_webhook_deliveries')
      .select('id, webhook_id, event_type, payload, response_status, response_body, attempt, delivered_at, created_at')
      .eq('webhook_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) return NextResponse.json({ deliveries: [] })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ deliveries: deliveries || [] })
  } catch (err) {
    console.error('Webhook deliveries GET error:', err)
    return NextResponse.json({ error: 'Failed to load deliveries' }, { status: 500 })
  }
}
