import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import type { WebhookSettings } from '@/types/settings'
import { defaultSettings } from '@/types/settings'

export type WebhookEventType =
  | 'feedback.submitted'
  | 'waitlist.entry'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'team.invited'
  | 'team.member_joined'
  | 'contact.submitted'
  | 'test.ping'

interface WebhookPayload {
  event: WebhookEventType
  timestamp: string
  data: Record<string, unknown>
}

const EVENT_TO_SETTING: Record<WebhookEventType, keyof WebhookSettings['events'] | null> = {
  'feedback.submitted': 'feedbackSubmitted',
  'waitlist.entry': 'waitlistEntry',
  'subscription.created': 'subscriptionCreated',
  'subscription.updated': 'subscriptionUpdated',
  'subscription.cancelled': 'subscriptionCancelled',
  'team.invited': 'teamInvited',
  'team.member_joined': 'teamMemberJoined',
  'contact.submitted': 'contactSubmitted',
  'test.ping': null,
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

async function getWebhookSettings(): Promise<WebhookSettings | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data } = await supabase
      .from('organization_settings')
      .select('settings')
      .eq('app_id', 'default')
      .single()

    const webhooks = {
      ...defaultSettings.webhooks!,
      ...(data?.settings?.webhooks || {}),
      events: {
        ...defaultSettings.webhooks!.events,
        ...(data?.settings?.webhooks?.events || {}),
      },
    }

    return webhooks
  } catch (err) {
    console.error('[Webhooks] Failed to load settings:', err)
    return null
  }
}

async function sendWebhook(url: string, payload: WebhookPayload, secret: string): Promise<void> {
  const body = JSON.stringify(payload)
  const signature = secret ? signPayload(body, secret) : ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-Event': payload.event,
    'X-Webhook-Timestamp': payload.timestamp,
  }

  if (signature) {
    headers['X-Webhook-Signature'] = `sha256=${signature}`
  }

  const maxRetries = 2
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (response.ok || response.status < 500) {
        console.log(`[Webhooks] ${payload.event} delivered (${response.status})`)
        return
      }

      console.warn(`[Webhooks] ${payload.event} attempt ${attempt + 1} failed: ${response.status}`)
    } catch (err) {
      console.warn(`[Webhooks] ${payload.event} attempt ${attempt + 1} error:`, (err as Error).message)
    }

    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }

  console.error(`[Webhooks] ${payload.event} delivery failed after ${maxRetries + 1} attempts`)
}

export function dispatchWebhook(event: WebhookEventType, data: Record<string, unknown>): void {
  (async () => {
    try {
      const settings = await getWebhookSettings()
      if (!settings?.enabled || !settings.url) return

      const settingKey = EVENT_TO_SETTING[event]
      if (settingKey !== null && !settings.events[settingKey]) return

      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      }

      await sendWebhook(settings.url, payload, settings.secret)
    } catch (err) {
      console.error(`[Webhooks] Dispatch error for ${event}:`, err)
    }
  })()
}

export async function dispatchWebhookSync(event: WebhookEventType, data: Record<string, unknown>): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const settings = await getWebhookSettings()
    if (!settings?.enabled || !settings.url) {
      return { success: false, error: 'Webhooks not enabled or URL not set' }
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    }

    const body = JSON.stringify(payload)
    const signature = settings.secret ? signPayload(body, settings.secret) : ''

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': payload.event,
      'X-Webhook-Timestamp': payload.timestamp,
    }
    if (signature) {
      headers['X-Webhook-Signature'] = `sha256=${signature}`
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(settings.url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    return { success: response.ok, status: response.status }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
