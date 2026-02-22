import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getConfigValue } from '@/lib/config/secrets'
import { getAppOrigin } from '@/lib/utils'
import crypto from 'crypto'

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

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

function getStateSigningKey(): string {
  const key = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('No signing key available — set SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY')
  return key
}

export function signState(payload: Record<string, any>): string {
  const nonce = crypto.randomBytes(16).toString('hex')
  const data = { ...payload, nonce, ts: Date.now() }
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url')
  const sig = crypto.createHmac('sha256', getStateSigningKey()).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

export function verifyState(stateParam: string): Record<string, any> | null {
  const parts = stateParam.split('.')
  if (parts.length !== 2) return null
  const [encoded, sig] = parts
  const expectedSig = crypto.createHmac('sha256', getStateSigningKey()).update(encoded).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null
  try {
    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'))
    const age = Date.now() - (data.ts || 0)
    if (age > 10 * 60 * 1000) return null
    return data
  } catch {
    return null
  }
}

const VALID_PLATFORMS = ['twitter', 'linkedin', 'facebook', 'instagram', 'reddit', 'discord']

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
  if (!platform || !VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` }, { status: 400 })
  }

  const origin = getAppOrigin(request)
  const redirectUri = `${origin}/api/social/callback/${platform}`
  console.log(`[Social Connect] Platform: ${platform}, origin: ${origin}, redirectUri: ${redirectUri}`)
  console.log(`[Social Connect] Origin sources — NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || '(not set)'}, VERCEL_URL: ${process.env.VERCEL_URL || '(not set)'}, x-forwarded-host: ${request.headers.get('x-forwarded-host') || '(not set)'}, host: ${request.headers.get('host') || '(not set)'}, nextUrl.origin: ${request.nextUrl.origin}`)

  try {
    let authUrl: string

    if (platform === 'facebook') {
      const appId = await getConfigValue('FACEBOOK_APP_ID')
      if (!appId) {
        return NextResponse.json({ error: 'Facebook App ID is not configured' }, { status: 500 })
      }

      const state = signState({ userId: user.id, platform, redirectUri })
      const fbParams = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        scope: 'email,public_profile',
        state,
      })
      authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${fbParams.toString()}`

    } else if (platform === 'linkedin') {
      const clientId = await getConfigValue('LINKEDIN_CLIENT_ID')
      if (!clientId) {
        return NextResponse.json({ error: 'LinkedIn Client ID is not configured' }, { status: 500 })
      }

      const state = signState({ userId: user.id, platform, redirectUri })
      const scope = 'openid profile email w_member_social'
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`
      console.log(`[Social Connect] LinkedIn redirect_uri: ${redirectUri}`)

    } else if (platform === 'twitter') {
      const apiKey = await getConfigValue('TWITTER_API_KEY')
      if (!apiKey) {
        return NextResponse.json({ error: 'Twitter API Key is not configured' }, { status: 500 })
      }

      const codeVerifier = generateCodeVerifier()
      const codeChallenge = generateCodeChallenge(codeVerifier)
      const state = signState({ userId: user.id, platform, codeVerifier, redirectUri })
      const twParams = new URLSearchParams({
        response_type: 'code',
        client_id: apiKey,
        redirect_uri: redirectUri,
        scope: 'tweet.read tweet.write users.read offline.access',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      })
      authUrl = `https://x.com/i/oauth2/authorize?${twParams.toString().replace(/\+/g, '%20')}`
      console.log(`[Social Connect] Twitter authUrl redirect_uri: ${redirectUri}`)

    } else if (platform === 'instagram') {
      const appId = await getConfigValue('FACEBOOK_APP_ID')
      if (!appId) {
        return NextResponse.json({ error: 'Instagram (Meta) App ID is not configured' }, { status: 500 })
      }

      const state = signState({ userId: user.id, platform, redirectUri })
      const igParams = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        scope: 'instagram_basic',
        response_type: 'code',
        state,
      })
      authUrl = `https://api.instagram.com/oauth/authorize?${igParams.toString()}`

    } else if (platform === 'reddit') {
      const clientId = await getConfigValue('REDDIT_CLIENT_ID')
      if (!clientId) {
        return NextResponse.json({ error: 'Reddit Client ID is not configured' }, { status: 500 })
      }

      const state = signState({ userId: user.id, platform, redirectUri })
      const redditParams = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        state,
        redirect_uri: redirectUri,
        duration: 'permanent',
        scope: 'identity submit read',
      })
      authUrl = `https://www.reddit.com/api/v1/authorize?${redditParams.toString()}`

    } else if (platform === 'discord') {
      const clientId = await getConfigValue('DISCORD_CLIENT_ID')
      if (!clientId) {
        return NextResponse.json({ error: 'Discord Client ID is not configured' }, { status: 500 })
      }

      const state = signState({ userId: user.id, platform, redirectUri })
      const discordParams = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: 'identify guilds webhook.incoming',
        state,
      })
      authUrl = `https://discord.com/oauth2/authorize?${discordParams.toString()}`

    } else {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }

    return NextResponse.json({ authUrl, debugRedirectUri: redirectUri })
  } catch (error) {
    console.error(`[Social Connect] Error building auth URL for ${platform}:`, error)
    return NextResponse.json({ error: 'Failed to generate authorization URL' }, { status: 500 })
  }
}
