import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getBlogClient } from '@/lib/social/blog-clients'
import { decryptToken } from '@/lib/social/crypto'

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

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { platform?: string; siteUrl?: string; apiKey?: string; connectionId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { platform, connectionId } = body

  if (connectionId) {
    const admin = getSupabaseAdmin()
    const { data: conn, error } = await admin
      .from('blog_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'Blog connections table not created yet.' }, { status: 500 })
      }
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }
    if (!conn) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const client = getBlogClient(conn.platform)
    if (!client) {
      return NextResponse.json({ error: `No client available for ${conn.platform}` }, { status: 400 })
    }

    const credential = conn.api_key_encrypted
      ? await decryptToken(conn.api_key_encrypted)
      : conn.access_token_encrypted
        ? await decryptToken(conn.access_token_encrypted)
        : null

    if (!credential || !conn.site_url) {
      return NextResponse.json({ error: 'Missing credentials or site URL for this connection' }, { status: 400 })
    }

    const result = await client.validateConnection(conn.site_url, credential)

    await admin
      .from('blog_connections')
      .update({
        is_valid: result.success,
        last_validated_at: new Date().toISOString(),
        last_error: result.error || null,
        ...(result.success && result.siteTitle ? { display_name: result.siteTitle } : {}),
        ...(result.success && result.username ? { platform_username: result.username } : {}),
      })
      .eq('id', connectionId)

    return NextResponse.json({
      valid: result.success,
      error: result.error,
      siteTitle: result.siteTitle,
      username: result.username,
    })
  }

  if (!platform) {
    return NextResponse.json({ error: 'platform or connectionId is required' }, { status: 400 })
  }

  const client = getBlogClient(platform)
  if (!client) {
    return NextResponse.json({ error: `No client available for ${platform}` }, { status: 400 })
  }

  const { siteUrl, apiKey } = body
  if (!siteUrl || !apiKey) {
    return NextResponse.json({ error: 'siteUrl and apiKey are required for validation' }, { status: 400 })
  }

  const result = await client.validateConnection(siteUrl, apiKey)

  return NextResponse.json({
    valid: result.success,
    error: result.error,
    siteTitle: result.siteTitle,
    username: result.username,
  })
}
