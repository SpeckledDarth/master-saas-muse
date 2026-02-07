import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'
import { isAllowedKey, setDbSecret, deleteDbSecret, getAllDbSecrets } from '@/lib/config/secrets'

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

async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()
    return data?.role === 'admin'
  } catch {
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from('team_members')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'owner'])
      .maybeSingle()
    return !!data
  }
}

function maskValue(value: string | undefined | null): string | null {
  if (!value) return null
  if (value.length <= 8) return '••••••••'
  const prefix = value.substring(0, 4)
  const suffix = value.substring(value.length - 4)
  return `${prefix}••••${suffix}`
}

interface IntegrationKey {
  id: string
  label: string
  envVar: string
  masked: string | null
  configured: boolean
  docsUrl: string
  source: 'env' | 'db' | null
}

interface IntegrationGroup {
  id: string
  label: string
  icon: string
  keys: IntegrationKey[]
}

function resolveValue(envVar: string, dbSecrets: Record<string, string>): { value: string | undefined; source: 'env' | 'db' | null } {
  const dbVal = dbSecrets[envVar]
  if (dbVal) return { value: dbVal, source: 'db' }
  const envVal = process.env[envVar]
  if (envVal) return { value: envVal, source: 'env' }
  return { value: undefined, source: null }
}

function buildTechStackGroups(dbSecrets: Record<string, string>): IntegrationGroup[] {
  function k(id: string, label: string, envVar: string, docsUrl: string): IntegrationKey {
    const { value, source } = resolveValue(envVar, dbSecrets)
    return { id, label, envVar, masked: maskValue(value), configured: !!value, docsUrl, source }
  }

  return [
    {
      id: 'supabase', label: 'Supabase', icon: 'database',
      keys: [
        k('supabase-url', 'Project URL', 'NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.com/dashboard/project/_/settings/api'),
        k('supabase-anon', 'Anon Key', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'https://supabase.com/dashboard/project/_/settings/api'),
        k('supabase-service', 'Service Role Key', 'SUPABASE_SERVICE_ROLE_KEY', 'https://supabase.com/dashboard/project/_/settings/api'),
      ],
    },
    {
      id: 'stripe', label: 'Stripe', icon: 'credit-card',
      keys: [
        k('stripe-secret', 'Secret Key', 'STRIPE_SECRET_KEY', 'https://dashboard.stripe.com/apikeys'),
        k('stripe-webhook', 'Webhook Secret', 'STRIPE_WEBHOOK_SECRET', 'https://dashboard.stripe.com/webhooks'),
      ],
    },
    {
      id: 'resend', label: 'Resend', icon: 'mail',
      keys: [
        k('resend-key', 'API Key', 'RESEND_API_KEY', 'https://resend.com/api-keys'),
      ],
    },
    {
      id: 'ai-providers', label: 'AI Providers', icon: 'brain',
      keys: [
        k('xai-key', 'xAI (Grok) API Key', 'XAI_API_KEY', 'https://console.x.ai/'),
        k('openai-key', 'OpenAI API Key', 'OPENAI_API_KEY', 'https://platform.openai.com/api-keys'),
        k('anthropic-key', 'Anthropic API Key', 'ANTHROPIC_API_KEY', 'https://console.anthropic.com/settings/keys'),
      ],
    },
    {
      id: 'redis', label: 'Upstash Redis', icon: 'server',
      keys: [
        k('redis-url', 'REST URL', 'UPSTASH_REDIS_REST_URL', 'https://console.upstash.com/'),
        k('redis-token', 'REST Token', 'UPSTASH_REDIS_REST_TOKEN', 'https://console.upstash.com/'),
      ],
    },
    {
      id: 'sentry', label: 'Sentry', icon: 'shield-alert',
      keys: [
        k('sentry-dsn', 'DSN', 'NEXT_PUBLIC_SENTRY_DSN', 'https://sentry.io/settings/'),
        k('sentry-org', 'Organization', 'SENTRY_ORG', 'https://sentry.io/settings/'),
        k('sentry-project', 'Project', 'SENTRY_PROJECT', 'https://sentry.io/settings/'),
      ],
    },
    {
      id: 'plausible', label: 'Plausible Analytics', icon: 'bar-chart',
      keys: [
        k('plausible-domain', 'Domain', 'NEXT_PUBLIC_PLAUSIBLE_DOMAIN', 'https://plausible.io/docs'),
        k('plausible-script', 'Script URL', 'NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL', 'https://plausible.io/docs'),
      ],
    },
  ]
}

function buildSocialPlatformGroups(dbSecrets: Record<string, string>): IntegrationGroup[] {
  function k(id: string, label: string, envVar: string, docsUrl: string): IntegrationKey {
    const { value, source } = resolveValue(envVar, dbSecrets)
    return { id, label, envVar, masked: maskValue(value), configured: !!value, docsUrl, source }
  }

  return [
    {
      id: 'social-twitter', label: 'Twitter / X', icon: 'twitter',
      keys: [
        k('twitter-api-key', 'API Key', 'TWITTER_API_KEY', 'https://developer.x.com/en/portal/dashboard'),
        k('twitter-api-secret', 'API Secret', 'TWITTER_API_SECRET', 'https://developer.x.com/en/portal/dashboard'),
        k('twitter-bearer', 'Bearer Token', 'TWITTER_BEARER_TOKEN', 'https://developer.x.com/en/portal/dashboard'),
      ],
    },
    {
      id: 'social-linkedin', label: 'LinkedIn', icon: 'linkedin',
      keys: [
        k('linkedin-client-id', 'Client ID', 'LINKEDIN_CLIENT_ID', 'https://www.linkedin.com/developers/apps'),
        k('linkedin-client-secret', 'Client Secret', 'LINKEDIN_CLIENT_SECRET', 'https://www.linkedin.com/developers/apps'),
      ],
    },
    {
      id: 'social-instagram', label: 'Instagram', icon: 'instagram',
      keys: [
        k('instagram-app-id', 'App ID', 'INSTAGRAM_APP_ID', 'https://developers.facebook.com/apps/'),
        k('instagram-app-secret', 'App Secret', 'INSTAGRAM_APP_SECRET', 'https://developers.facebook.com/apps/'),
      ],
    },
    {
      id: 'social-youtube', label: 'YouTube', icon: 'youtube',
      keys: [
        k('youtube-api-key', 'API Key', 'YOUTUBE_API_KEY', 'https://console.cloud.google.com/apis/credentials'),
        k('youtube-client-id', 'OAuth Client ID', 'YOUTUBE_CLIENT_ID', 'https://console.cloud.google.com/apis/credentials'),
        k('youtube-client-secret', 'OAuth Client Secret', 'YOUTUBE_CLIENT_SECRET', 'https://console.cloud.google.com/apis/credentials'),
      ],
    },
    {
      id: 'social-facebook', label: 'Facebook', icon: 'facebook',
      keys: [
        k('facebook-app-id', 'App ID', 'FACEBOOK_APP_ID', 'https://developers.facebook.com/apps/'),
        k('facebook-app-secret', 'App Secret', 'FACEBOOK_APP_SECRET', 'https://developers.facebook.com/apps/'),
      ],
    },
    {
      id: 'social-tiktok', label: 'TikTok', icon: 'tiktok',
      keys: [
        k('tiktok-client-key', 'Client Key', 'TIKTOK_CLIENT_KEY', 'https://developers.tiktok.com/apps/'),
        k('tiktok-client-secret', 'Client Secret', 'TIKTOK_CLIENT_SECRET', 'https://developers.tiktok.com/apps/'),
      ],
    },
    {
      id: 'social-reddit', label: 'Reddit', icon: 'reddit',
      keys: [
        k('reddit-client-id', 'Client ID', 'REDDIT_CLIENT_ID', 'https://www.reddit.com/prefs/apps'),
        k('reddit-client-secret', 'Client Secret', 'REDDIT_CLIENT_SECRET', 'https://www.reddit.com/prefs/apps'),
      ],
    },
    {
      id: 'social-pinterest', label: 'Pinterest', icon: 'pinterest',
      keys: [
        k('pinterest-app-id', 'App ID', 'PINTEREST_APP_ID', 'https://developers.pinterest.com/apps/'),
        k('pinterest-app-secret', 'App Secret', 'PINTEREST_APP_SECRET', 'https://developers.pinterest.com/apps/'),
      ],
    },
    {
      id: 'social-snapchat', label: 'Snapchat', icon: 'snapchat',
      keys: [
        k('snapchat-client-id', 'Client ID', 'SNAPCHAT_CLIENT_ID', 'https://kit.snapchat.com/manage/'),
        k('snapchat-client-secret', 'Client Secret', 'SNAPCHAT_CLIENT_SECRET', 'https://kit.snapchat.com/manage/'),
      ],
    },
    {
      id: 'social-discord', label: 'Discord', icon: 'discord',
      keys: [
        k('discord-client-id', 'Client ID', 'DISCORD_CLIENT_ID', 'https://discord.com/developers/applications'),
        k('discord-client-secret', 'Client Secret', 'DISCORD_CLIENT_SECRET', 'https://discord.com/developers/applications'),
        k('discord-bot-token', 'Bot Token', 'DISCORD_BOT_TOKEN', 'https://discord.com/developers/applications'),
      ],
    },
  ]
}

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isAdminUser(user.id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const dbSecrets = await getAllDbSecrets()

  const techStack = buildTechStackGroups(dbSecrets)
  const socialPlatforms = buildSocialPlatformGroups(dbSecrets)

  const techConfigured = techStack.reduce((sum, g) => sum + g.keys.filter(k => k.configured).length, 0)
  const techTotal = techStack.reduce((sum, g) => sum + g.keys.length, 0)
  const socialConfigured = socialPlatforms.reduce((sum, g) => sum + g.keys.filter(k => k.configured).length, 0)
  const socialTotal = socialPlatforms.reduce((sum, g) => sum + g.keys.length, 0)

  return NextResponse.json({
    techStack,
    socialPlatforms,
    summary: {
      techConfigured,
      techTotal,
      socialConfigured,
      socialTotal,
    },
  })
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isAdminUser(user.id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { envVar, value } = body

    if (!envVar || typeof envVar !== 'string') {
      return NextResponse.json({ error: 'Missing envVar' }, { status: 400 })
    }

    if (!isAllowedKey(envVar)) {
      return NextResponse.json({ error: 'Key not in allowed list' }, { status: 400 })
    }

    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return NextResponse.json({ error: 'Value cannot be empty' }, { status: 400 })
    }

    const saved = await setDbSecret(envVar, value.trim(), user.id)
    if (!saved) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      envVar,
      masked: maskValue(value.trim()),
      configured: true,
      source: 'db',
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isAdminUser(user.id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { envVar } = body

    if (!envVar || typeof envVar !== 'string') {
      return NextResponse.json({ error: 'Missing envVar' }, { status: 400 })
    }

    if (!isAllowedKey(envVar)) {
      return NextResponse.json({ error: 'Key not in allowed list' }, { status: 400 })
    }

    const deleted = await deleteDbSecret(envVar)
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    const envStillSet = !!process.env[envVar]

    return NextResponse.json({
      success: true,
      envVar,
      configured: envStillSet,
      source: envStillSet ? 'env' : null,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
