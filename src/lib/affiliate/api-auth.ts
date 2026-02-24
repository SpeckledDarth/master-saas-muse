import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHash } from 'crypto'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_MAX = 100
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function generateApiKey(): { fullKey: string; prefix: string; hash: string } {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = 'affk_'
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return {
    fullKey: key,
    prefix: key.substring(0, 12),
    hash: hashApiKey(key),
  }
}

function checkRateLimit(keyPrefix: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(keyPrefix)

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS
    rateLimitMap.set(keyPrefix, { count: 1, resetAt })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt }
}

export interface ApiKeyAuth {
  affiliateUserId: string
  keyId: string
}

export async function validateApiKey(request: NextRequest): Promise<
  { success: true; auth: ApiKeyAuth; headers: Record<string, string> } |
  { success: false; response: NextResponse }
> {
  const apiKey = request.headers.get('X-API-Key')

  if (!apiKey) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Missing X-API-Key header' },
        { status: 401 }
      ),
    }
  }

  const keyHash = hashApiKey(apiKey)
  const admin = createAdminClient()

  try {
    const { data: keyRecord, error } = await admin
      .from('affiliate_api_keys')
      .select('id, affiliate_user_id, api_key_prefix, is_active')
      .eq('api_key_hash', keyHash)
      .maybeSingle()

    if (error || !keyRecord) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        ),
      }
    }

    if (!keyRecord.is_active) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'API key has been revoked' },
          { status: 401 }
        ),
      }
    }

    const rateLimit = checkRateLimit(keyRecord.api_key_prefix)
    if (!rateLimit.allowed) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Rate limit exceeded. Max 100 requests per hour.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
            },
          }
        ),
      }
    }

    admin
      .from('affiliate_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id)
      .then(() => {})

    return {
      success: true,
      auth: {
        affiliateUserId: keyRecord.affiliate_user_id,
        keyId: keyRecord.id,
      },
      headers: {
        'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
      },
    }
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'API keys table not configured' },
          { status: 503 }
        ),
      }
    }
    console.error('API key validation error:', err)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
    }
  }
}
