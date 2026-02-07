import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

function maskValue(value: string | undefined): string | null {
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
}

interface IntegrationGroup {
  id: string
  label: string
  icon: string
  keys: IntegrationKey[]
}

function buildTechStackGroups(): IntegrationGroup[] {
  return [
    {
      id: 'supabase',
      label: 'Supabase',
      icon: 'database',
      keys: [
        {
          id: 'supabase-url',
          label: 'Project URL',
          envVar: 'NEXT_PUBLIC_SUPABASE_URL',
          masked: maskValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
          configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          docsUrl: 'https://supabase.com/dashboard/project/_/settings/api',
        },
        {
          id: 'supabase-anon',
          label: 'Anon Key',
          envVar: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          masked: maskValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          docsUrl: 'https://supabase.com/dashboard/project/_/settings/api',
        },
        {
          id: 'supabase-service',
          label: 'Service Role Key',
          envVar: 'SUPABASE_SERVICE_ROLE_KEY',
          masked: maskValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
          configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          docsUrl: 'https://supabase.com/dashboard/project/_/settings/api',
        },
      ],
    },
    {
      id: 'stripe',
      label: 'Stripe',
      icon: 'credit-card',
      keys: [
        {
          id: 'stripe-secret',
          label: 'Secret Key',
          envVar: 'STRIPE_SECRET_KEY',
          masked: maskValue(process.env.STRIPE_SECRET_KEY),
          configured: !!process.env.STRIPE_SECRET_KEY,
          docsUrl: 'https://dashboard.stripe.com/apikeys',
        },
        {
          id: 'stripe-webhook',
          label: 'Webhook Secret',
          envVar: 'STRIPE_WEBHOOK_SECRET',
          masked: maskValue(process.env.STRIPE_WEBHOOK_SECRET),
          configured: !!process.env.STRIPE_WEBHOOK_SECRET,
          docsUrl: 'https://dashboard.stripe.com/webhooks',
        },
      ],
    },
    {
      id: 'resend',
      label: 'Resend',
      icon: 'mail',
      keys: [
        {
          id: 'resend-key',
          label: 'API Key',
          envVar: 'RESEND_API_KEY',
          masked: maskValue(process.env.RESEND_API_KEY),
          configured: !!process.env.RESEND_API_KEY,
          docsUrl: 'https://resend.com/api-keys',
        },
      ],
    },
    {
      id: 'ai-providers',
      label: 'AI Providers',
      icon: 'brain',
      keys: [
        {
          id: 'xai-key',
          label: 'xAI (Grok) API Key',
          envVar: 'XAI_API_KEY',
          masked: maskValue(process.env.XAI_API_KEY),
          configured: !!process.env.XAI_API_KEY,
          docsUrl: 'https://console.x.ai/',
        },
        {
          id: 'openai-key',
          label: 'OpenAI API Key',
          envVar: 'OPENAI_API_KEY',
          masked: maskValue(process.env.OPENAI_API_KEY),
          configured: !!process.env.OPENAI_API_KEY,
          docsUrl: 'https://platform.openai.com/api-keys',
        },
        {
          id: 'anthropic-key',
          label: 'Anthropic API Key',
          envVar: 'ANTHROPIC_API_KEY',
          masked: maskValue(process.env.ANTHROPIC_API_KEY),
          configured: !!process.env.ANTHROPIC_API_KEY,
          docsUrl: 'https://console.anthropic.com/settings/keys',
        },
      ],
    },
    {
      id: 'redis',
      label: 'Upstash Redis',
      icon: 'server',
      keys: [
        {
          id: 'redis-url',
          label: 'REST URL',
          envVar: 'UPSTASH_REDIS_REST_URL',
          masked: maskValue(process.env.UPSTASH_REDIS_REST_URL),
          configured: !!process.env.UPSTASH_REDIS_REST_URL,
          docsUrl: 'https://console.upstash.com/',
        },
        {
          id: 'redis-token',
          label: 'REST Token',
          envVar: 'UPSTASH_REDIS_REST_TOKEN',
          masked: maskValue(process.env.UPSTASH_REDIS_REST_TOKEN),
          configured: !!process.env.UPSTASH_REDIS_REST_TOKEN,
          docsUrl: 'https://console.upstash.com/',
        },
      ],
    },
    {
      id: 'sentry',
      label: 'Sentry',
      icon: 'shield-alert',
      keys: [
        {
          id: 'sentry-dsn',
          label: 'DSN',
          envVar: 'NEXT_PUBLIC_SENTRY_DSN',
          masked: maskValue(process.env.NEXT_PUBLIC_SENTRY_DSN),
          configured: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
          docsUrl: 'https://sentry.io/settings/',
        },
        {
          id: 'sentry-org',
          label: 'Organization',
          envVar: 'SENTRY_ORG',
          masked: maskValue(process.env.SENTRY_ORG),
          configured: !!process.env.SENTRY_ORG,
          docsUrl: 'https://sentry.io/settings/',
        },
        {
          id: 'sentry-project',
          label: 'Project',
          envVar: 'SENTRY_PROJECT',
          masked: maskValue(process.env.SENTRY_PROJECT),
          configured: !!process.env.SENTRY_PROJECT,
          docsUrl: 'https://sentry.io/settings/',
        },
      ],
    },
    {
      id: 'plausible',
      label: 'Plausible Analytics',
      icon: 'bar-chart',
      keys: [
        {
          id: 'plausible-domain',
          label: 'Domain',
          envVar: 'NEXT_PUBLIC_PLAUSIBLE_DOMAIN',
          masked: maskValue(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
          configured: !!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
          docsUrl: 'https://plausible.io/docs',
        },
        {
          id: 'plausible-script',
          label: 'Script URL',
          envVar: 'NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL',
          masked: maskValue(process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL),
          configured: !!process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL,
          docsUrl: 'https://plausible.io/docs',
        },
      ],
    },
  ]
}

function buildSocialPlatformGroups(): IntegrationGroup[] {
  return [
    {
      id: 'social-twitter',
      label: 'Twitter / X',
      icon: 'twitter',
      keys: [
        {
          id: 'twitter-api-key',
          label: 'API Key',
          envVar: 'TWITTER_API_KEY',
          masked: maskValue(process.env.TWITTER_API_KEY),
          configured: !!process.env.TWITTER_API_KEY,
          docsUrl: 'https://developer.x.com/en/portal/dashboard',
        },
        {
          id: 'twitter-api-secret',
          label: 'API Secret',
          envVar: 'TWITTER_API_SECRET',
          masked: maskValue(process.env.TWITTER_API_SECRET),
          configured: !!process.env.TWITTER_API_SECRET,
          docsUrl: 'https://developer.x.com/en/portal/dashboard',
        },
        {
          id: 'twitter-bearer',
          label: 'Bearer Token',
          envVar: 'TWITTER_BEARER_TOKEN',
          masked: maskValue(process.env.TWITTER_BEARER_TOKEN),
          configured: !!process.env.TWITTER_BEARER_TOKEN,
          docsUrl: 'https://developer.x.com/en/portal/dashboard',
        },
      ],
    },
    {
      id: 'social-linkedin',
      label: 'LinkedIn',
      icon: 'linkedin',
      keys: [
        {
          id: 'linkedin-client-id',
          label: 'Client ID',
          envVar: 'LINKEDIN_CLIENT_ID',
          masked: maskValue(process.env.LINKEDIN_CLIENT_ID),
          configured: !!process.env.LINKEDIN_CLIENT_ID,
          docsUrl: 'https://www.linkedin.com/developers/apps',
        },
        {
          id: 'linkedin-client-secret',
          label: 'Client Secret',
          envVar: 'LINKEDIN_CLIENT_SECRET',
          masked: maskValue(process.env.LINKEDIN_CLIENT_SECRET),
          configured: !!process.env.LINKEDIN_CLIENT_SECRET,
          docsUrl: 'https://www.linkedin.com/developers/apps',
        },
      ],
    },
    {
      id: 'social-instagram',
      label: 'Instagram',
      icon: 'instagram',
      keys: [
        {
          id: 'instagram-app-id',
          label: 'App ID',
          envVar: 'INSTAGRAM_APP_ID',
          masked: maskValue(process.env.INSTAGRAM_APP_ID),
          configured: !!process.env.INSTAGRAM_APP_ID,
          docsUrl: 'https://developers.facebook.com/apps/',
        },
        {
          id: 'instagram-app-secret',
          label: 'App Secret',
          envVar: 'INSTAGRAM_APP_SECRET',
          masked: maskValue(process.env.INSTAGRAM_APP_SECRET),
          configured: !!process.env.INSTAGRAM_APP_SECRET,
          docsUrl: 'https://developers.facebook.com/apps/',
        },
      ],
    },
    {
      id: 'social-youtube',
      label: 'YouTube',
      icon: 'youtube',
      keys: [
        {
          id: 'youtube-api-key',
          label: 'API Key',
          envVar: 'YOUTUBE_API_KEY',
          masked: maskValue(process.env.YOUTUBE_API_KEY),
          configured: !!process.env.YOUTUBE_API_KEY,
          docsUrl: 'https://console.cloud.google.com/apis/credentials',
        },
        {
          id: 'youtube-client-id',
          label: 'OAuth Client ID',
          envVar: 'YOUTUBE_CLIENT_ID',
          masked: maskValue(process.env.YOUTUBE_CLIENT_ID),
          configured: !!process.env.YOUTUBE_CLIENT_ID,
          docsUrl: 'https://console.cloud.google.com/apis/credentials',
        },
        {
          id: 'youtube-client-secret',
          label: 'OAuth Client Secret',
          envVar: 'YOUTUBE_CLIENT_SECRET',
          masked: maskValue(process.env.YOUTUBE_CLIENT_SECRET),
          configured: !!process.env.YOUTUBE_CLIENT_SECRET,
          docsUrl: 'https://console.cloud.google.com/apis/credentials',
        },
      ],
    },
    {
      id: 'social-facebook',
      label: 'Facebook',
      icon: 'facebook',
      keys: [
        {
          id: 'facebook-app-id',
          label: 'App ID',
          envVar: 'FACEBOOK_APP_ID',
          masked: maskValue(process.env.FACEBOOK_APP_ID),
          configured: !!process.env.FACEBOOK_APP_ID,
          docsUrl: 'https://developers.facebook.com/apps/',
        },
        {
          id: 'facebook-app-secret',
          label: 'App Secret',
          envVar: 'FACEBOOK_APP_SECRET',
          masked: maskValue(process.env.FACEBOOK_APP_SECRET),
          configured: !!process.env.FACEBOOK_APP_SECRET,
          docsUrl: 'https://developers.facebook.com/apps/',
        },
      ],
    },
    {
      id: 'social-tiktok',
      label: 'TikTok',
      icon: 'tiktok',
      keys: [
        {
          id: 'tiktok-client-key',
          label: 'Client Key',
          envVar: 'TIKTOK_CLIENT_KEY',
          masked: maskValue(process.env.TIKTOK_CLIENT_KEY),
          configured: !!process.env.TIKTOK_CLIENT_KEY,
          docsUrl: 'https://developers.tiktok.com/apps/',
        },
        {
          id: 'tiktok-client-secret',
          label: 'Client Secret',
          envVar: 'TIKTOK_CLIENT_SECRET',
          masked: maskValue(process.env.TIKTOK_CLIENT_SECRET),
          configured: !!process.env.TIKTOK_CLIENT_SECRET,
          docsUrl: 'https://developers.tiktok.com/apps/',
        },
      ],
    },
    {
      id: 'social-reddit',
      label: 'Reddit',
      icon: 'reddit',
      keys: [
        {
          id: 'reddit-client-id',
          label: 'Client ID',
          envVar: 'REDDIT_CLIENT_ID',
          masked: maskValue(process.env.REDDIT_CLIENT_ID),
          configured: !!process.env.REDDIT_CLIENT_ID,
          docsUrl: 'https://www.reddit.com/prefs/apps',
        },
        {
          id: 'reddit-client-secret',
          label: 'Client Secret',
          envVar: 'REDDIT_CLIENT_SECRET',
          masked: maskValue(process.env.REDDIT_CLIENT_SECRET),
          configured: !!process.env.REDDIT_CLIENT_SECRET,
          docsUrl: 'https://www.reddit.com/prefs/apps',
        },
      ],
    },
    {
      id: 'social-pinterest',
      label: 'Pinterest',
      icon: 'pinterest',
      keys: [
        {
          id: 'pinterest-app-id',
          label: 'App ID',
          envVar: 'PINTEREST_APP_ID',
          masked: maskValue(process.env.PINTEREST_APP_ID),
          configured: !!process.env.PINTEREST_APP_ID,
          docsUrl: 'https://developers.pinterest.com/apps/',
        },
        {
          id: 'pinterest-app-secret',
          label: 'App Secret',
          envVar: 'PINTEREST_APP_SECRET',
          masked: maskValue(process.env.PINTEREST_APP_SECRET),
          configured: !!process.env.PINTEREST_APP_SECRET,
          docsUrl: 'https://developers.pinterest.com/apps/',
        },
      ],
    },
    {
      id: 'social-snapchat',
      label: 'Snapchat',
      icon: 'snapchat',
      keys: [
        {
          id: 'snapchat-client-id',
          label: 'Client ID',
          envVar: 'SNAPCHAT_CLIENT_ID',
          masked: maskValue(process.env.SNAPCHAT_CLIENT_ID),
          configured: !!process.env.SNAPCHAT_CLIENT_ID,
          docsUrl: 'https://kit.snapchat.com/manage/',
        },
        {
          id: 'snapchat-client-secret',
          label: 'Client Secret',
          envVar: 'SNAPCHAT_CLIENT_SECRET',
          masked: maskValue(process.env.SNAPCHAT_CLIENT_SECRET),
          configured: !!process.env.SNAPCHAT_CLIENT_SECRET,
          docsUrl: 'https://kit.snapchat.com/manage/',
        },
      ],
    },
    {
      id: 'social-discord',
      label: 'Discord',
      icon: 'discord',
      keys: [
        {
          id: 'discord-client-id',
          label: 'Client ID',
          envVar: 'DISCORD_CLIENT_ID',
          masked: maskValue(process.env.DISCORD_CLIENT_ID),
          configured: !!process.env.DISCORD_CLIENT_ID,
          docsUrl: 'https://discord.com/developers/applications',
        },
        {
          id: 'discord-client-secret',
          label: 'Client Secret',
          envVar: 'DISCORD_CLIENT_SECRET',
          masked: maskValue(process.env.DISCORD_CLIENT_SECRET),
          configured: !!process.env.DISCORD_CLIENT_SECRET,
          docsUrl: 'https://discord.com/developers/applications',
        },
        {
          id: 'discord-bot-token',
          label: 'Bot Token',
          envVar: 'DISCORD_BOT_TOKEN',
          masked: maskValue(process.env.DISCORD_BOT_TOKEN),
          configured: !!process.env.DISCORD_BOT_TOKEN,
          docsUrl: 'https://discord.com/developers/applications',
        },
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

  const techStack = buildTechStackGroups()
  const socialPlatforms = buildSocialPlatformGroups()

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
