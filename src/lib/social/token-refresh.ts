import { createClient } from '@supabase/supabase-js'
import { decryptToken, encryptToken } from '@/lib/social/crypto'
import { getConfigValue } from '@/lib/config/secrets'

export type RefreshResult = {
  success: boolean
  newAccessToken?: string
  error?: string
  requiresReconnect?: boolean
}

const TOKEN_EXPIRY_DEFAULTS: Record<string, number> = {
  twitter: 2 * 60 * 60,
  linkedin: 60 * 24 * 60 * 60,
  facebook: 60 * 24 * 60 * 60,
  instagram: 60 * 24 * 60 * 60,
  reddit: 24 * 60 * 60,
  discord: 7 * 24 * 60 * 60,
  youtube: 3600,
  pinterest: 30 * 24 * 60 * 60,
}

export function computeTokenExpiry(platform: string, expiresIn?: number): string {
  const seconds = expiresIn || TOKEN_EXPIRY_DEFAULTS[platform] || 3600
  return new Date(Date.now() + seconds * 1000).toISOString()
}

export function isTokenExpiringSoon(expiresAt: string | null, bufferMinutes = 15): boolean {
  if (!expiresAt) return true
  const expiry = new Date(expiresAt).getTime()
  const now = Date.now()
  const buffer = bufferMinutes * 60 * 1000
  return now + buffer >= expiry
}

async function refreshTwitterToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const apiKey = await getConfigValue('TWITTER_API_KEY')
  const apiSecret = await getConfigValue('TWITTER_API_SECRET')
  if (!apiKey || !apiSecret) {
    throw new Error('Twitter credentials not configured')
  }

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: apiKey,
  })

  const response = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    if (response.status === 400 || response.status === 401) {
      throw new TokenExpiredError(`Twitter refresh token revoked or expired (${response.status}): ${errText}`)
    }
    throw new Error(`Twitter token refresh failed (${response.status}): ${errText}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    expiresIn: data.expires_in,
  }
}

async function refreshLinkedInToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const clientId = await getConfigValue('LINKEDIN_CLIENT_ID')
  const clientSecret = await getConfigValue('LINKEDIN_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('LinkedIn credentials not configured')
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    if (response.status === 400 || response.status === 401) {
      throw new TokenExpiredError(`LinkedIn refresh token expired (${response.status}): ${errText}`)
    }
    throw new Error(`LinkedIn token refresh failed (${response.status}): ${errText}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    expiresIn: data.expires_in,
  }
}

async function refreshFacebookToken(currentAccessToken: string): Promise<{ accessToken: string; expiresIn?: number }> {
  const appId = await getConfigValue('FACEBOOK_APP_ID')
  const appSecret = await getConfigValue('FACEBOOK_APP_SECRET')
  if (!appId || !appSecret) {
    throw new Error('Facebook credentials not configured')
  }

  const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('fb_exchange_token', currentAccessToken)

  const response = await fetch(url.toString(), {
    method: 'GET',
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    if (response.status === 400 || response.status === 401) {
      throw new TokenExpiredError(`Facebook token expired or invalid (${response.status}): ${errText}`)
    }
    throw new Error(`Facebook token refresh failed (${response.status}): ${errText}`)
  }

  const data = await response.json()
  if (!data.access_token) {
    throw new Error('Facebook returned no access token during refresh')
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  }
}

async function refreshInstagramToken(currentAccessToken: string): Promise<{ accessToken: string; expiresIn?: number }> {
  const url = new URL('https://graph.instagram.com/refresh_access_token')
  url.searchParams.set('grant_type', 'ig_refresh_token')
  url.searchParams.set('access_token', currentAccessToken)

  const response = await fetch(url.toString(), {
    method: 'GET',
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    if (response.status === 400 || response.status === 401) {
      throw new TokenExpiredError(`Instagram token expired or invalid (${response.status}): ${errText}`)
    }
    throw new Error(`Instagram token refresh failed (${response.status}): ${errText}`)
  }

  const data = await response.json()
  if (!data.access_token) {
    throw new Error('Instagram returned no access token during refresh')
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  }
}

async function refreshRedditToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const clientId = await getConfigValue('REDDIT_CLIENT_ID')
  const clientSecret = await getConfigValue('REDDIT_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('Reddit credentials not configured')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
      'User-Agent': 'PassivePost/1.0',
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    if (response.status === 400 || response.status === 401) {
      throw new TokenExpiredError(`Reddit refresh token revoked or expired (${response.status}): ${errText}`)
    }
    throw new Error(`Reddit token refresh failed (${response.status}): ${errText}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    expiresIn: data.expires_in,
  }
}

async function refreshDiscordToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const clientId = await getConfigValue('DISCORD_CLIENT_ID')
  const clientSecret = await getConfigValue('DISCORD_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('Discord credentials not configured')
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    if (response.status === 400 || response.status === 401) {
      throw new TokenExpiredError(`Discord refresh token expired (${response.status}): ${errText}`)
    }
    throw new Error(`Discord token refresh failed (${response.status}): ${errText}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    expiresIn: data.expires_in,
  }
}

async function refreshYouTubeToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const clientId = await getConfigValue('GOOGLE_CLIENT_ID')
  const clientSecret = await getConfigValue('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('Google credentials not configured')
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    if (response.status === 400 || response.status === 401) {
      throw new TokenExpiredError(`YouTube (Google) refresh token revoked or expired (${response.status}): ${errText}`)
    }
    throw new Error(`YouTube token refresh failed (${response.status}): ${errText}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    expiresIn: data.expires_in,
  }
}

async function refreshPinterestToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const appId = await getConfigValue('PINTEREST_APP_ID')
  const appSecret = await getConfigValue('PINTEREST_APP_SECRET')
  if (!appId || !appSecret) {
    throw new Error('Pinterest credentials not configured')
  }

  const credentials = Buffer.from(`${appId}:${appSecret}`).toString('base64')

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    if (response.status === 400 || response.status === 401) {
      throw new TokenExpiredError(`Pinterest refresh token expired (${response.status}): ${errText}`)
    }
    throw new Error(`Pinterest token refresh failed (${response.status}): ${errText}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    expiresIn: data.access_token_expiration || data.expires_in,
  }
}

export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TokenExpiredError'
  }
}

export async function refreshAccessToken(
  platform: string,
  userId: string,
  refreshTokenOrAccessTokenEncrypted: string
): Promise<RefreshResult> {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  try {
    const decryptedToken = await decryptToken(refreshTokenOrAccessTokenEncrypted)

    let newAccessToken: string
    let newRefreshToken: string | undefined
    let expiresIn: number | undefined

    if (platform === 'twitter') {
      const result = await refreshTwitterToken(decryptedToken)
      newAccessToken = result.accessToken
      newRefreshToken = result.refreshToken
      expiresIn = result.expiresIn
    } else if (platform === 'linkedin') {
      const result = await refreshLinkedInToken(decryptedToken)
      newAccessToken = result.accessToken
      newRefreshToken = result.refreshToken
      expiresIn = result.expiresIn
    } else if (platform === 'facebook') {
      const result = await refreshFacebookToken(decryptedToken)
      newAccessToken = result.accessToken
      expiresIn = result.expiresIn
    } else if (platform === 'instagram') {
      const result = await refreshInstagramToken(decryptedToken)
      newAccessToken = result.accessToken
      expiresIn = result.expiresIn
    } else if (platform === 'reddit') {
      const result = await refreshRedditToken(decryptedToken)
      newAccessToken = result.accessToken
      newRefreshToken = result.refreshToken
      expiresIn = result.expiresIn
    } else if (platform === 'discord') {
      const result = await refreshDiscordToken(decryptedToken)
      newAccessToken = result.accessToken
      newRefreshToken = result.refreshToken
      expiresIn = result.expiresIn
    } else if (platform === 'youtube') {
      const result = await refreshYouTubeToken(decryptedToken)
      newAccessToken = result.accessToken
      newRefreshToken = result.refreshToken
      expiresIn = result.expiresIn
    } else if (platform === 'pinterest') {
      const result = await refreshPinterestToken(decryptedToken)
      newAccessToken = result.accessToken
      newRefreshToken = result.refreshToken
      expiresIn = result.expiresIn
    } else {
      return { success: false, error: `Token refresh not supported for ${platform}` }
    }

    const updateData: Record<string, any> = {
      access_token_encrypted: await encryptToken(newAccessToken),
      is_valid: true,
      last_validated_at: new Date().toISOString(),
      last_error: null,
      token_expires_at: computeTokenExpiry(platform, expiresIn),
      updated_at: new Date().toISOString(),
    }

    if (newRefreshToken) {
      updateData.refresh_token_encrypted = await encryptToken(newRefreshToken)
    }

    await admin
      .from('social_accounts')
      .update(updateData)
      .eq('user_id', userId)
      .eq('platform', platform)

    console.log(`[TokenRefresh] Successfully refreshed ${platform} token for user ${userId}`)
    return { success: true, newAccessToken }
  } catch (err) {
    const error = err as Error
    const requiresReconnect = error instanceof TokenExpiredError
    const errorMessage = error.message

    console.error(`[TokenRefresh] Failed to refresh ${platform} token for user ${userId}:`, errorMessage)

    await admin
      .from('social_accounts')
      .update({
        is_valid: false,
        last_error: requiresReconnect
          ? `Token expired — please reconnect your ${platform} account`
          : errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', platform)

    return {
      success: false,
      error: errorMessage,
      requiresReconnect,
    }
  }
}
