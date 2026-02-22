import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { encryptToken } from '@/lib/social/crypto'
import { getBlogClient } from '@/lib/social/blog-clients'
import { BLOG_PLATFORMS } from '@/lib/social/types'
import type { BlogPlatform } from '@/lib/social/types'

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

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('blog_connections')
      .select('id, user_id, platform, platform_username, display_name, site_url, is_valid, last_validated_at, last_error, connected_at, updated_at')
      .eq('user_id', user.id)
      .order('connected_at', { ascending: false })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ connections: [], note: 'Blog connections table not created yet. Run migrations/extensions/003_blog_publishing_tables.sql' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ connections: data || [] })
  } catch {
    return NextResponse.json({ connections: [], note: 'Could not query blog connections.' })
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { platform?: string; apiKey?: string; accessToken?: string; siteUrl?: string; username?: string; displayName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { platform, apiKey, accessToken, siteUrl, username, displayName } = body

  if (!platform || !BLOG_PLATFORMS.includes(platform as BlogPlatform)) {
    return NextResponse.json({ error: `Invalid platform. Must be one of: ${BLOG_PLATFORMS.join(', ')}` }, { status: 400 })
  }

  if (platform === 'linkedin_article') {
    const admin = getSupabaseAdmin()
    const { data: linkedinAccount } = await admin
      .from('social_accounts')
      .select('id, platform_username, display_name')
      .eq('user_id', user.id)
      .eq('platform', 'linkedin')
      .eq('is_valid', true)
      .single()

    if (!linkedinAccount) {
      return NextResponse.json({ error: 'Connect your LinkedIn social account first to use LinkedIn Articles.' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('blog_connections')
      .upsert({
        user_id: user.id,
        platform: 'linkedin_article',
        platform_username: linkedinAccount.platform_username,
        display_name: linkedinAccount.display_name || 'LinkedIn Articles',
        site_url: null,
        is_valid: true,
        last_validated_at: new Date().toISOString(),
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform' })
      .select('id, user_id, platform, platform_username, display_name, site_url, is_valid, last_validated_at, connected_at, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ connection: data })
  }

  if (!apiKey && !accessToken) {
    return NextResponse.json({ error: 'An API key or access token is required' }, { status: 400 })
  }

  if ((platform === 'wordpress' || platform === 'ghost') && !siteUrl) {
    return NextResponse.json({ error: 'Site URL is required for this platform' }, { status: 400 })
  }

  try {
    const blogClient = getBlogClient(platform)
    let validatedUsername = username || null
    let validatedDisplayName = displayName || null
    let isValid = true
    let lastError: string | null = null

    if (blogClient && siteUrl && apiKey) {
      const validation = await blogClient.validateConnection(siteUrl, apiKey)
      isValid = validation.success
      lastError = validation.error || null
      if (validation.success) {
        if (validation.username && !username) validatedUsername = validation.username
        if (validation.siteTitle && !displayName) validatedDisplayName = validation.siteTitle
      } else {
        return NextResponse.json({
          error: validation.error || 'Connection validation failed. Please check your credentials.',
          validationFailed: true,
        }, { status: 400 })
      }
    }

    const encryptedApiKey = apiKey ? await encryptToken(apiKey) : null
    const encryptedAccessToken = accessToken ? await encryptToken(accessToken) : null

    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('blog_connections')
      .upsert({
        user_id: user.id,
        platform,
        platform_username: validatedUsername,
        display_name: validatedDisplayName,
        site_url: siteUrl || null,
        api_key_encrypted: encryptedApiKey,
        access_token_encrypted: encryptedAccessToken,
        is_valid: isValid,
        last_validated_at: new Date().toISOString(),
        last_error: lastError,
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform' })
      .select('id, user_id, platform, platform_username, display_name, site_url, is_valid, last_validated_at, connected_at, updated_at')
      .single()

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'Blog connections table not created yet. Run migrations/extensions/003_blog_publishing_tables.sql' }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ connection: data })
  } catch (err) {
    return NextResponse.json({ error: `Failed to save connection: ${(err as Error).message}` }, { status: 500 })
  }
}
