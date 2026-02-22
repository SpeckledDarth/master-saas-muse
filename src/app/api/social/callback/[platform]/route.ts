import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getConfigValue } from '@/lib/config/secrets'
import { getPlatformClient, type SocialPlatform } from '@/lib/social/client'
import { encryptToken } from '@/lib/social/crypto'
import { computeTokenExpiry } from '@/lib/social/token-refresh'
import { verifyState } from '@/app/api/social/connect/route'
import { getAppOrigin } from '@/lib/utils'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const VALID_PLATFORMS = ['twitter', 'linkedin', 'facebook', 'instagram', 'reddit', 'discord']

function redirectWithError(baseUrl: string, message: string, platform?: string) {
  console.error('[Social Callback] OAuth error:', message)
  const url = new URL('/oauth/error', baseUrl)
  url.searchParams.set('error', message)
  if (platform) url.searchParams.set('platform', platform)
  return NextResponse.redirect(url.toString())
}

function redirectWithSuccess(baseUrl: string, platform: string) {
  console.log('[Social Callback] OAuth success for:', platform)
  const url = new URL('/dashboard/social', baseUrl)
  url.searchParams.set('connected', platform)
  return NextResponse.redirect(url.toString())
}

interface StatePayload {
  userId: string
  platform: string
  codeVerifier?: string
  redirectUri?: string
}

async function exchangeFacebookToken(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number; pageTokens?: Array<{ id: string; name: string; access_token: string }> }> {
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
  let expiresIn: number | undefined
  if (longLivedRes.ok) {
    const longLivedData = await longLivedRes.json()
    accessToken = longLivedData.access_token || shortLivedToken
    expiresIn = longLivedData.expires_in
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

  return { accessToken, expiresIn, pageTokens }
}

async function exchangeLinkedInToken(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
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
    expiresIn: tokenData.expires_in,
  }
}

async function exchangeTwitterToken(code: string, redirectUri: string, codeVerifier: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const apiKey = await getConfigValue('TWITTER_API_KEY')
  const apiSecret = await getConfigValue('TWITTER_API_SECRET')
  if (!apiKey || !apiSecret) throw new Error('Twitter credentials not configured')

  console.log('[Twitter Token Exchange] redirect_uri:', redirectUri)
  console.log('[Twitter Token Exchange] client_id length:', apiKey.length, 'client_secret length:', apiSecret.length)

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: apiKey,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  })

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

  const tokenRes = await fetch('https://api.x.com/2/oauth2/token', {
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
    console.error('[Twitter Token Exchange] Failed:', tokenRes.status, errData)
    throw new Error(`Twitter token exchange failed (${tokenRes.status}): ${errData}`)
  }

  const tokenData = await tokenRes.json()
  console.log('[Twitter Token Exchange] Success, token type:', tokenData.token_type)
  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
  }
}

async function exchangeInstagramToken(code: string, redirectUri: string): Promise<{ accessToken: string; expiresIn?: number }> {
  const appId = await getConfigValue('FACEBOOK_APP_ID')
  const appSecret = await getConfigValue('FACEBOOK_APP_SECRET')
  if (!appId || !appSecret) throw new Error('Instagram (Meta) credentials not configured')

  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  })

  const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })

  if (!tokenRes.ok) {
    const errData = await tokenRes.text().catch(() => 'Unknown error')
    throw new Error(`Instagram token exchange failed: ${errData}`)
  }

  const tokenData = await tokenRes.json()
  const shortLivedToken = tokenData.access_token

  const longLivedUrl = new URL('https://graph.instagram.com/access_token')
  longLivedUrl.searchParams.set('grant_type', 'ig_exchange_token')
  longLivedUrl.searchParams.set('client_secret', appSecret)
  longLivedUrl.searchParams.set('access_token', shortLivedToken)

  const longLivedRes = await fetch(longLivedUrl.toString(), { method: 'GET', signal: AbortSignal.timeout(15000) })
  let accessToken = shortLivedToken
  let expiresIn: number | undefined

  if (longLivedRes.ok) {
    const longLivedData = await longLivedRes.json()
    accessToken = longLivedData.access_token || shortLivedToken
    expiresIn = longLivedData.expires_in
  }

  return { accessToken, expiresIn }
}

async function exchangeRedditToken(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const clientId = await getConfigValue('REDDIT_CLIENT_ID')
  const clientSecret = await getConfigValue('REDDIT_CLIENT_SECRET')
  if (!clientId || !clientSecret) throw new Error('Reddit credentials not configured')

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })

  const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
      'User-Agent': 'PassivePost/1.0',
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })

  if (!tokenRes.ok) {
    const errData = await tokenRes.text().catch(() => 'Unknown error')
    throw new Error(`Reddit token exchange failed: ${errData}`)
  }

  const tokenData = await tokenRes.json()
  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
  }
}

async function exchangeDiscordToken(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number; webhook?: { id: string; token: string; channel_id: string; guild_id: string } }> {
  const clientId = await getConfigValue('DISCORD_CLIENT_ID')
  const clientSecret = await getConfigValue('DISCORD_CLIENT_SECRET')
  if (!clientId || !clientSecret) throw new Error('Discord credentials not configured')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })

  if (!tokenRes.ok) {
    const errData = await tokenRes.text().catch(() => 'Unknown error')
    throw new Error(`Discord token exchange failed: ${errData}`)
  }

  const tokenData = await tokenRes.json()
  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    webhook: tokenData.webhook,
  }
}

function getFriendlyOAuthError(errorCode: string, description: string, platform: string): string {
  const platformNames: Record<string, string> = {
    twitter: 'X (Twitter)',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    instagram: 'Instagram',
    reddit: 'Reddit',
    discord: 'Discord',
  }
  const name = platformNames[platform] || platform

  if (errorCode === 'access_denied' || errorCode === 'user_denied') {
    return `You declined the ${name} connection request. If this was a mistake, try connecting again.`
  }
  if (errorCode === 'consent_required') {
    return `${name} requires you to grant permissions before connecting. Please try again and accept the permissions.`
  }
  if (errorCode === 'server_error' || errorCode === 'temporarily_unavailable') {
    return `${name} is temporarily unavailable. Please wait a few minutes and try again.`
  }
  if (errorCode === 'invalid_scope') {
    return `The permissions requested from ${name} are not available. This may mean the app needs to be reviewed by ${name}.`
  }
  if (description.toLowerCase().includes('redirect_uri') || description.toLowerCase().includes('redirect uri')) {
    return `Callback URL mismatch — the redirect URL registered in your ${name} developer app doesn't match your site URL.`
  }

  return description || `Connection to ${name} failed: ${errorCode}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  const baseUrl = getAppOrigin(request)

  console.log(`[Social Callback] Hit for platform: ${platform}, baseUrl: ${baseUrl}, nextUrl.origin: ${request.nextUrl.origin}`)

  if (!VALID_PLATFORMS.includes(platform)) {
    return redirectWithError(baseUrl, 'Invalid platform')
  }

  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const errorParam = searchParams.get('error')

  console.log(`[Social Callback] code present: ${!!code}, state present: ${!!stateParam}, error: ${errorParam || 'none'}`)

  if (errorParam) {
    const errorDescription = searchParams.get('error_description') || errorParam
    const friendlyMessage = getFriendlyOAuthError(errorParam, errorDescription, platform)
    return redirectWithError(baseUrl, friendlyMessage, platform)
  }

  if (!code || !stateParam) {
    return redirectWithError(baseUrl, 'Missing authorization code or state', platform)
  }

  const verified = verifyState(stateParam)
  if (!verified) {
    console.error('[Social Callback] State verification failed - invalid signature or expired')
    return redirectWithError(baseUrl, 'Invalid or expired state parameter. Please try connecting again.', platform)
  }

  const state: StatePayload = { userId: verified.userId, platform: verified.platform, codeVerifier: verified.codeVerifier, redirectUri: verified.redirectUri }

  if (!state.userId || !state.platform) {
    return redirectWithError(baseUrl, 'Invalid state payload', platform)
  }

  if (state.platform !== platform) {
    return redirectWithError(baseUrl, 'State platform mismatch', platform)
  }

  const redirectUri = state.redirectUri || `${baseUrl}/api/social/callback/${platform}`
  console.log(`[Social Callback] Using redirectUri for token exchange: ${redirectUri}`)

  try {
    let accessToken: string
    let refreshToken: string | undefined
    let expiresIn: number | undefined

    if (platform === 'facebook') {
      const result = await exchangeFacebookToken(code, redirectUri)
      if (result.pageTokens && result.pageTokens.length > 0) {
        accessToken = result.pageTokens[0].access_token
      } else {
        accessToken = result.accessToken
      }
      refreshToken = undefined
      expiresIn = result.expiresIn
    } else if (platform === 'linkedin') {
      const result = await exchangeLinkedInToken(code, redirectUri)
      accessToken = result.accessToken
      refreshToken = result.refreshToken
      expiresIn = result.expiresIn
    } else if (platform === 'twitter') {
      if (!state.codeVerifier) {
        return redirectWithError(baseUrl, 'Missing code verifier for Twitter PKCE', platform)
      }
      const result = await exchangeTwitterToken(code, redirectUri, state.codeVerifier)
      accessToken = result.accessToken
      refreshToken = result.refreshToken
      expiresIn = result.expiresIn
    } else if (platform === 'instagram') {
      const result = await exchangeInstagramToken(code, redirectUri)
      accessToken = result.accessToken
      refreshToken = undefined
      expiresIn = result.expiresIn
    } else if (platform === 'reddit') {
      const result = await exchangeRedditToken(code, redirectUri)
      accessToken = result.accessToken
      refreshToken = result.refreshToken
      expiresIn = result.expiresIn
    } else if (platform === 'discord') {
      const result = await exchangeDiscordToken(code, redirectUri)
      accessToken = result.accessToken
      refreshToken = result.refreshToken
      expiresIn = result.expiresIn
    } else {
      return redirectWithError(baseUrl, 'Unsupported platform', platform)
    }

    const client = getPlatformClient(platform as SocialPlatform)
    const validation = await client.validateToken(accessToken)
    if (!validation.valid) {
      return redirectWithError(baseUrl, `Token validation failed: ${validation.error || 'Unknown error'}`, platform)
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
        access_token_encrypted: await encryptToken(accessToken),
        refresh_token_encrypted: refreshToken ? await encryptToken(refreshToken) : null,
        token_expires_at: computeTokenExpiry(platform, expiresIn),
        is_valid: true,
        last_validated_at: new Date().toISOString(),
        last_error: null,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform',
      })

    if (upsertError) {
      console.error(`[Social Callback] Upsert error for ${platform}:`, JSON.stringify(upsertError))
      return redirectWithError(baseUrl, `Failed to save account connection: ${upsertError.message || upsertError.code || 'Unknown database error'}`, platform)
    }

    return redirectWithSuccess(baseUrl, platform)
  } catch (error) {
    console.error(`[Social Callback] Error for ${platform}:`, error)
    const rawMessage = (error as Error).message || 'Connection failed'

    let friendlyMessage = rawMessage
    if (rawMessage.includes('token exchange failed')) {
      friendlyMessage = `Token exchange with ${platform} failed. This usually means the authorization code expired or credentials are incorrect. Please try connecting again.`
    } else if (rawMessage.includes('credentials not configured')) {
      friendlyMessage = `${platform} API credentials are not configured. Please check your admin settings.`
    } else if (rawMessage.includes('ETIMEDOUT') || rawMessage.includes('timeout') || rawMessage.includes('AbortError')) {
      friendlyMessage = `The connection to ${platform} timed out. Please check your internet connection and try again.`
    } else if (rawMessage.includes('Token validation failed')) {
      friendlyMessage = `${platform} returned a token but it could not be validated. The token may have been revoked. Please try again.`
    }

    return redirectWithError(baseUrl, friendlyMessage, platform)
  }
}
