import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export const WEBHOOK_EVENTS = [
  'affiliate.click',
  'affiliate.signup',
  'affiliate.commission',
  'affiliate.payout',
  'affiliate.tier_change',
  'affiliate.milestone',
] as const

export type WebhookEventType = typeof WEBHOOK_EVENTS[number]

function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')
}

async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  eventType: string,
  payload: Record<string, any>,
  attempt: number = 1
): Promise<{ success: boolean; status?: number; body?: string }> {
  const payloadStr = JSON.stringify(payload)
  const signature = signPayload(payloadStr, secret)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': eventType,
        'X-Webhook-Attempt': String(attempt),
      },
      body: payloadStr,
      signal: AbortSignal.timeout(10000),
    })

    const body = await response.text().catch(() => '')

    return {
      success: response.ok,
      status: response.status,
      body: body.slice(0, 1000),
    }
  } catch (err: any) {
    return {
      success: false,
      status: 0,
      body: err?.message || 'Connection failed',
    }
  }
}

export async function fireWebhookEvent(
  affiliateUserId: string,
  eventType: WebhookEventType,
  payload: Record<string, any>
) {
  try {
    const admin = createAdminClient()

    const { data: webhooks, error } = await admin
      .from('affiliate_webhooks')
      .select('*')
      .eq('affiliate_user_id', affiliateUserId)
      .eq('is_active', true)

    if (error) {
      if (error.code === '42P01') return
      console.error('[Webhooks] Failed to fetch webhooks:', error.message)
      return
    }

    if (!webhooks || webhooks.length === 0) return

    const matchingWebhooks = webhooks.filter(
      (w: any) => w.events && w.events.includes(eventType)
    )

    for (const webhook of matchingWebhooks) {
      const fullPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      }

      let delivered = false
      const maxAttempts = 3

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (attempt > 1) {
          const delay = Math.pow(2, attempt - 1) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const result = await deliverWebhook(
          webhook.id,
          webhook.url,
          webhook.secret,
          eventType,
          fullPayload,
          attempt
        )

        try {
          const deliveryRecord: Record<string, any> = {
            webhook_id: webhook.id,
            event_type: eventType,
            payload: fullPayload,
            response_status: result.status || null,
            response_body: result.body || null,
            attempt,
            delivered_at: result.success ? new Date().toISOString() : null,
          }
          await admin.from('affiliate_webhook_deliveries').insert(deliveryRecord)
        } catch (logErr) {
          console.error('[Webhooks] Failed to log delivery:', logErr)
        }

        if (result.success) {
          delivered = true
          await admin
            .from('affiliate_webhooks')
            .update({
              last_triggered_at: new Date().toISOString(),
              failure_count: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('id', webhook.id)
          break
        }
      }

      if (!delivered) {
        const newFailureCount = (webhook.failure_count || 0) + 1
        const updateData: Record<string, any> = {
          failure_count: newFailureCount,
          updated_at: new Date().toISOString(),
        }
        if (newFailureCount >= 10) {
          updateData.is_active = false
        }
        await admin
          .from('affiliate_webhooks')
          .update(updateData)
          .eq('id', webhook.id)
      }
    }
  } catch (err) {
    console.error('[Webhooks] Error firing webhook event:', err)
  }
}

export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex')
}
