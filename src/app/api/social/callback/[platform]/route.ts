import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getConfigValue } from '@/lib/config/secrets'
import { getPlatformClient, type SocialPlatform } from '@/lib/social/client'
import { verifyState } from '@/app/api/social/connect/route'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const VALID_PLATFORMS = ['twitter', 'linkedin', 'facebook']

function redirectWithError(baseUrl: string, message: string) {
  const url = new URL('/dashboard/social/onboarding', baseUrl)
  url.searchParams.set('error', message)
  return NextResponse.redirect(url.toString())
}

function redirectWithSuccess(baseUrl: string, platform: string) {
  const url = new URL('/dashboard/social/onboarding', baseUrl)
  url.searchParams.set('connected', platform)
  return NextResponse.redirect(url.toString())
}

interface StatePayload {
  userId: string
  platform: string
  codeVerifier?: string
}

async function exchangeFacebookToken(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken?: string; pageTokens?: Array<{ id: string; name: string; access_token: string }> }> {
  const appId = await getConfigValue('FACEBOOK_APP_ID')
  const appSecret = await getConfigValue('FACEBOOK_APP_SECRET')
  if (!appId || !appSecret) throw new Error('Facebook credentials not configured')

  const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
  tokenUrl.searchParams.set('client_id', appId)
  tokenUrl.searchParams.set('client_secret', appSecret)
  tokenUrl.searchParams.set('redirect_uri', redirectUri)
  tokenUrl.searchParams.set('code', code)

  const tokenRes = await fetch(tokenUrl.toString(), { method: 'GET', signal: AbortSignal.timeout(15000) })
  if (!tokenRes.ok) {
    const errData = await tokenRes.text().catch(() => 'Unknown error')
    throw new Error(`Facebook token exchange failed: ${errData}`)
  }
  const tokenData = await tokenRes.json()
  const shortLivedToken = tokenData.access_token

  const longLivedUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
  longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token')
  longLivedUrl.searchParams.set('client_id', appId)
  longLivedUrl.searchParams.set('client_secret', appSecret)
  longLivedUrl.searchParams.set('fb_exchange_token', shortLivedToken)

  const longLivedRes = await fetch(longLivedUrl.toString(), { method: 'GET', signal: AbortSignal.timeout(15000) })
  let accessToken = shortLivedToken
  if (longLivedRes.ok) {
    const longLivedData = await longLivedRes.json()
    accessToken = longLivedData.access_token || shortLivedToken
  }

  const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${encodeURIComponent(accessToken)}`, {
    signal: AbortSignal.timeout(15000),
  })
  let pageTokens: Array<{ id: string; name: string; access_token: string }> = []
  if (pagesRes.ok) {
    const pagesData = await pagesRes.json()
    pageTokens = (pagesData.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      access_token: p.access_token,
    }))
  }

  return { accessToken, pageTokens }
}

async function exchangeLinkedInToken(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken?: string }> {
  const clientId = await getConfigValue('LINKEDIN_CLIENT_ID')
  const clientSecret = await getConfigValue('LINKEDIN_CLIENT_SECRET')
  if (!clientId || !clientSecret) throw new Error('LinkedIn credentials not configured')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  })

  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })

  if (!tokenRes.ok) {
    const errData = await tokenRes.text().catch(() => 'Unknown error')
    throw new Error(`LinkedIn token exchange failed: ${errData}`)
  }

  const tokenData = await tokenRes.json()
  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
  }
}

async function exchangeTwitterToken(code: string, redirectUri: string, codeVerifier: string): Promise<{ accessToken: string; refreshToken?: string }> {
  const apiKey = await getConfigValue('TWITTER_API_KEY')
  const apiSecret = await getConfigValue('TWITTER_API_SECRET')
  if (!apiKey || !apiSecret) throw new Error('Twitter credentials not configured')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: apiKey,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  })

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

  const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })

  if (!tokenRes.ok) {
    const errData = await tokenRes.text().catch(() => 'Unknown error')
    throw new Error(`Twitter token exchange failed: ${errData}`)
  }

  const tokenData = await tokenRes.json()
  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  const baseUrl = request.nextUrl.origin

  if (!VALID_PLATFORMS.includes(platform)) {
    return redirectWithError(baseUrl, 'Invalid platform')
  }

  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const errorParam = searchParams.get('error')

  if (errorParam) {
    const errorDescription = searchParams.get('error_description') || errorParam
    return redirectWithError(baseUrl, errorDescription)
  }

  if (!code || !stateParam) {
    return redirectWithError(baseUrl, 'Missing authorization code or state')
  }

  const verified = verifyState(stateParam)
  if (!verified) {
    return redirectWithError(baseUrl, 'Invalid or expired state parameter')
  }

  const state: StatePayload = { userId: verified.userId, platform: verified.platform, codeVerifier: verified.codeVerifier }

  if (!state.userId || !state.platform) {
    return redirectWithError(baseUrl, 'Invalid state payload')
  }

  if (state.platform !== platform) {
    return redirectWithError(baseUrl, 'State platform mismatch')
  }

  const redirectUri = `${baseUrl}/api/social/callback/${platform}`

  try {
    let accessToken: string
    let refreshToken: string | undefined

    if (platform === 'facebook') {
      const result = await exchangeFacebookToken(code, redirectUri)
      if (result.pageTokens && result.pageTokens.length > 0) {
        accessToken = result.pageTokens[0].access_token
      } else {
        accessToken = result.accessToken
      }
      refreshToken = undefined
    } else if (platform === 'linkedin') {
      const result = await exchangeLinkedInToken(code, redirectUri)
      accessToken = result.accessToken
      refreshToken = result.refreshToken
    } else if (platform === 'twitter') {
      if (!state.codeVerifier) {
        return redirectWithError(baseUrl, 'Missing code verifier for Twitter PKCE')
      }
      const result = await exchangeTwitterToken(code, redirectUri, state.codeVerifier)
      accessToken = result.accessToken
      refreshToken = result.refreshToken
    } else {
      return redirectWithError(baseUrl, 'Unsupported platform')
    }

    const client = getPlatformClient(platform as SocialPlatform)
    const validation = await client.validateToken(accessToken)
    if (!validation.valid) {
      return redirectWithError(baseUrl, `Token validation failed: ${validation.error || 'Unknown error'}`)
    }

    const profile = await client.getUserProfile(accessToken)

    const admin = getSupabaseAdmin()
    const { error: upsertError } = await admin
      .from('social_accounts')
      .upsert({
        user_id: state.userId,
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

    if (upsertError) {
      console.error(`[Social Callback] Upsert error for ${platform}:`, upsertError)
      return redirectWithError(baseUrl, 'Failed to save account connection')
    }

    return redirectWithSuccess(baseUrl, platform)
  } catch (error) {
    console.error(`[Social Callback] Error for ${platform}:`, error)
    const message = (error as Error).message || 'Connection failed'
    return redirectWithError(baseUrl, message)
  }
}
