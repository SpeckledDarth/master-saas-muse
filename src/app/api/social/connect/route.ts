import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getConfigValue } from '@/lib/config/secrets'
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
  return process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-signing-key'
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

const VALID_PLATFORMS = ['twitter', 'linkedin', 'facebook']

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

  const origin = request.nextUrl.origin
  const redirectUri = `${origin}/api/social/callback/${platform}`
  console.log(`[Social Connect] Platform: ${platform}, redirectUri: ${redirectUri}`)

  try {
    let authUrl: string

    if (platform === 'facebook') {
      const appId = await getConfigValue('FACEBOOK_APP_ID')
      if (!appId) {
        return NextResponse.json({ error: 'Facebook App ID is not configured' }, { status: 500 })
      }

      const state = signState({ userId: user.id, platform })
      authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_manage_posts,pages_read_engagement,pages_show_list&state=${state}`

    } else if (platform === 'linkedin') {
      const clientId = await getConfigValue('LINKEDIN_CLIENT_ID')
      if (!clientId) {
        return NextResponse.json({ error: 'LinkedIn Client ID is not configured' }, { status: 500 })
      }

      const state = signState({ userId: user.id, platform })
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email%20w_member_social&state=${state}`

    } else if (platform === 'twitter') {
      const apiKey = await getConfigValue('TWITTER_API_KEY')
      if (!apiKey) {
        return NextResponse.json({ error: 'Twitter API Key is not configured' }, { status: 500 })
      }

      const codeVerifier = generateCodeVerifier()
      const codeChallenge = generateCodeChallenge(codeVerifier)
      const state = signState({ userId: user.id, platform, codeVerifier })
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(apiKey)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`
      console.log(`[Social Connect] Twitter authUrl redirect_uri: ${redirectUri}`)

    } else {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }

    return NextResponse.json({ authUrl, debugRedirectUri: redirectUri })
  } catch (error) {
    console.error(`[Social Connect] Error building auth URL for ${platform}:`, error)
    return NextResponse.json({ error: 'Failed to generate authorization URL' }, { status: 500 })
  }
}
