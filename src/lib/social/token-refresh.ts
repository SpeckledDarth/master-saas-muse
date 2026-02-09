import { createClient } from '@supabase/supabase-js'
import { decryptToken, encryptToken } from '@/lib/social/crypto'
import { getConfigValue } from '@/lib/config/secrets'

export async function refreshAccessToken(
  platform: string,
  userId: string,
  refreshTokenEncrypted: string
): Promise<string | null> {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  try {
    if (platform === 'facebook') {
      return null
    }

    const refreshToken = decryptToken(refreshTokenEncrypted)

    let newAccessToken: string | null = null
    let newRefreshToken: string | null = null

    if (platform === 'linkedin') {
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
        throw new Error(`LinkedIn token refresh failed (${response.status}): ${errText}`)
      }

      const data = await response.json()
      newAccessToken = data.access_token
      newRefreshToken = data.refresh_token || null
    } else if (platform === 'twitter') {
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

      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
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
        throw new Error(`Twitter token refresh failed (${response.status}): ${errText}`)
      }

      const data = await response.json()
      newAccessToken = data.access_token
      newRefreshToken = data.refresh_token || null
    } else {
      return null
    }

    if (!newAccessToken) {
      throw new Error(`Token refresh returned no access token for ${platform}`)
    }

    const updateData: Record<string, any> = {
      access_token_encrypted: encryptToken(newAccessToken),
      is_valid: true,
      last_validated_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    }

    if (newRefreshToken) {
      updateData.refresh_token_encrypted = encryptToken(newRefreshToken)
    }

    await admin
      .from('social_accounts')
      .update(updateData)
      .eq('user_id', userId)
      .eq('platform', platform)

    return newAccessToken
  } catch (err) {
    console.error(`[TokenRefresh] Failed to refresh ${platform} token for user ${userId}:`, (err as Error).message)

    await admin
      .from('social_accounts')
      .update({
        is_valid: false,
        last_error: (err as Error).message,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', platform)

    return null
  }
}
