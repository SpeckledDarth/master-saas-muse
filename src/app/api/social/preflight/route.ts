import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getConfigValue } from '@/lib/config/secrets'
import { getAppOrigin } from '@/lib/utils'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

type CheckResult = { ok: boolean; label: string; detail?: string }

const PLATFORM_CREDENTIALS: Record<string, { keys: string[]; callbackPath: string }> = {
  twitter: {
    keys: ['TWITTER_API_KEY', 'TWITTER_API_SECRET'],
    callbackPath: '/api/social/callback/twitter',
  },
  linkedin: {
    keys: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
    callbackPath: '/api/social/callback/linkedin',
  },
  facebook: {
    keys: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
    callbackPath: '/api/social/callback/facebook',
  },
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { platform?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { platform } = body
  if (!platform || !PLATFORM_CREDENTIALS[platform]) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  const checks: CheckResult[] = []
  const config = PLATFORM_CREDENTIALS[platform]
  const origin = getAppOrigin(request)

  for (const key of config.keys) {
    const value = await getConfigValue(key)
    checks.push({
      ok: !!value,
      label: `${key} is configured`,
      detail: value ? undefined : `Missing environment variable: ${key}. Add it in your hosting platform's environment variables settings.`,
    })
  }

  const hasSessionSecret = !!process.env.SESSION_SECRET || !!process.env.SUPABASE_SERVICE_ROLE_KEY
  checks.push({
    ok: hasSessionSecret,
    label: 'State signing key available',
    detail: hasSessionSecret ? undefined : 'Missing SESSION_SECRET environment variable. This is needed to secure the OAuth flow.',
  })

  const hasAppUrl = !!process.env.NEXT_PUBLIC_APP_URL
  const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
  checks.push({
    ok: hasAppUrl || !isProduction,
    label: 'App URL is configured',
    detail: !hasAppUrl && isProduction
      ? `NEXT_PUBLIC_APP_URL is not set. Set it to your production domain (e.g., https://yourapp.com) so OAuth callback URLs resolve correctly.`
      : undefined,
  })

  if (hasAppUrl && process.env.NEXT_PUBLIC_APP_URL) {
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    const detectedOrigin = origin.replace(/\/$/, '')
    const originsMatch = configuredOrigin === detectedOrigin
    checks.push({
      ok: originsMatch,
      label: 'App URL matches detected origin',
      detail: originsMatch ? undefined : `NEXT_PUBLIC_APP_URL is "${configuredOrigin}" but the detected origin is "${detectedOrigin}". These must match or OAuth callbacks will fail. Update NEXT_PUBLIC_APP_URL to match your actual domain.`,
    })
  }

  const callbackUrl = `${origin}${config.callbackPath}`
  checks.push({
    ok: true,
    label: `Callback URL for ${platform}`,
    detail: `Register this exact URL in your ${platform} developer portal: ${callbackUrl}`,
  })

  const admin = getSupabaseAdmin()

  const { error: socialTableError } = await admin
    .from('social_accounts')
    .select('id')
    .limit(1)
  const socialTableExists = !socialTableError || !socialTableError.message.includes('does not exist')
  checks.push({
    ok: socialTableExists,
    label: 'social_accounts table exists',
    detail: socialTableExists ? undefined : 'The social_accounts table is missing from your database. Run the migration: migrations/core/001_social_tables.sql in your Supabase SQL Editor.',
  })

  const { error: configTableError } = await admin
    .from('config_secrets')
    .select('id')
    .limit(1)
  const configTableExists = !configTableError || !configTableError.message.includes('does not exist')
  checks.push({
    ok: configTableExists,
    label: 'config_secrets table exists',
    detail: configTableExists ? undefined : 'The config_secrets table is missing. It should auto-create on first use, but you can create it manually with: CREATE TABLE config_secrets (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, key_name text NOT NULL UNIQUE, encrypted_value text NOT NULL, updated_at timestamptz DEFAULT now(), updated_by text);',
  })

  let encryptionKeyExists = false
  try {
    const keyValue = process.env.SOCIAL_ENCRYPTION_KEY
    if (keyValue) {
      encryptionKeyExists = true
    } else {
      const dbKey = await getConfigValue('SOCIAL_ENCRYPTION_KEY')
      encryptionKeyExists = !!dbKey
    }
  } catch {
    encryptionKeyExists = false
  }
  checks.push({
    ok: encryptionKeyExists,
    label: 'Encryption key available',
    detail: encryptionKeyExists ? undefined : 'SOCIAL_ENCRYPTION_KEY is not set. Either set it as an environment variable (run: openssl rand -hex 32) or it will auto-generate on first connection attempt.',
  })

  const allPassed = checks.every(c => c.ok)
  const failures = checks.filter(c => !c.ok)

  return NextResponse.json({
    ready: allPassed,
    platform,
    callbackUrl,
    origin,
    checks,
    failures,
  })
}
