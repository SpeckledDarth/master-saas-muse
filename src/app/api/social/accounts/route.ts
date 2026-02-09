import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPlatformClient, type SocialPlatform } from '@/lib/social/client'
import { checkPlatformLimit } from '@/lib/social/rate-limits'
import { getUserSocialTier } from '@/lib/social/user-tier'

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

async function isModuleEnabled(): Promise<boolean> {
  const admin = getSupabaseAdmin()
  const { data } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
  return data?.settings?.features?.socialModuleEnabled ?? false
}

const VALID_PLATFORMS: SocialPlatform[] = ['twitter', 'linkedin', 'instagram', 'facebook', 'youtube', 'tiktok', 'reddit', 'pinterest', 'snapchat', 'discord']

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const enabled = await isModuleEnabled()
  if (!enabled) {
    return NextResponse.json({ error: 'Social module is not enabled' }, { status: 403 })
  }

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('social_accounts')
      .select('id, user_id, platform, platform_user_id, platform_username, display_name, is_valid, last_validated_at, last_error, connected_at, updated_at')
      .eq('user_id', user.id)
      .order('connected_at', { ascending: false })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          accounts: [],
          note: 'Social accounts table has not been created yet. Please run the migration in src/lib/social/schema.sql'
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ accounts: data || [] })
  } catch (err) {
    return NextResponse.json({
      accounts: [],
      note: 'Could not query social accounts. The table may not exist yet.'
    })
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const enabled = await isModuleEnabled()
  if (!enabled) {
    return NextResponse.json({ error: 'Social module is not enabled' }, { status: 403 })
  }

  let body: { platform?: string; accessToken?: string; refreshToken?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { platform, accessToken, refreshToken } = body

  if (!platform || !VALID_PLATFORMS.includes(platform as SocialPlatform)) {
    return NextResponse.json({ error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` }, { status: 400 })
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const settingsRes = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
  const adminTier: string = settingsRes.data?.settings?.socialModule?.tier ?? 'tier_1'
  const { tier } = await getUserSocialTier(user.id, adminTier)

  const { data: existingAccounts } = await admin
    .from('social_accounts')
    .select('id, platform')
    .eq('user_id', user.id)

  const uniquePlatforms = new Set((existingAccounts || []).map((a: { platform: string }) => a.platform))
  if (!uniquePlatforms.has(platform)) {
    const platformCheck = checkPlatformLimit(uniquePlatforms.size, tier)
    if (!platformCheck.allowed) {
      return NextResponse.json({
        error: `Platform limit reached. Your ${tier} plan allows ${platformCheck.maxPlatforms} platforms. Upgrade for more.`
      }, { status: 429 })
    }
  }

  const client = getPlatformClient(platform as SocialPlatform)
  const validation = await client.validateToken(accessToken)

  if (!validation.valid) {
    return NextResponse.json({ error: `Token validation failed: ${validation.error}` }, { status: 400 })
  }

  const profile = await client.getUserProfile(accessToken)

  try {
    const { data, error } = await admin
      .from('social_accounts')
      .upsert({
        user_id: user.id,
        platform,
        platform_user_id: profile?.id || null,
        platform_username: profile?.username || null,
        display_name: profile?.displayName || null,
        access_token_encrypted: accessToken,
        refresh_token_encrypted: refreshToken || null,
        is_valid: true,
        last_validated_at: new Date().toISOString(),
        last_error: null,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform',
      })
      .select('id, user_id, platform, platform_user_id, platform_username, display_name, is_valid, last_validated_at, last_error, connected_at')
      .single()

    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Social accounts table has not been created yet. Please run the migration in src/lib/social/schema.sql'
        }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ account: data })
  } catch (err) {
    return NextResponse.json({
      error: 'Could not save social account. The table may not exist yet. Please run the migration in src/lib/social/schema.sql'
    }, { status: 500 })
  }
}
