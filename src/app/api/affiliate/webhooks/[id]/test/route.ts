import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: webhook, error: fetchErr } = await admin
      .from('affiliate_webhooks')
      .select('*')
      .eq('id', id)
      .eq('affiliate_user_id', user.id)
      .single()

    if (fetchErr || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const testPayload = {
      event: 'affiliate.test',
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook delivery',
        webhook_id: webhook.id,
      },
    }

    const payloadStr = JSON.stringify(testPayload)
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(payloadStr, 'utf8')
      .digest('hex')

    let responseStatus = 0
    let responseBody = ''
    let success = false

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'affiliate.test',
          'X-Webhook-Attempt': '1',
        },
        body: payloadStr,
        signal: AbortSignal.timeout(10000),
      })

      responseStatus = response.status
      responseBody = await response.text().catch(() => '')
      responseBody = responseBody.slice(0, 1000)
      success = response.ok
    } catch (err: any) {
      responseBody = err?.message || 'Connection failed'
    }

    try {
      await admin.from('affiliate_webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type: 'affiliate.test',
        payload: testPayload,
        response_status: responseStatus || null,
        response_body: responseBody || null,
        attempt: 1,
        delivered_at: success ? new Date().toISOString() : null,
      })
    } catch (logErr) {
      console.error('[Webhook Test] Failed to log delivery:', logErr)
    }

    return NextResponse.json({
      success,
      status: responseStatus,
      body: responseBody,
    })
  } catch (err) {
    console.error('Webhook test error:', err)
    return NextResponse.json({ error: 'Failed to test webhook' }, { status: 500 })
  }
}
