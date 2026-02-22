import { createClient } from '@supabase/supabase-js'
import { decryptToken } from '@/lib/social/crypto'
import { refreshAccessToken, isTokenExpiringSoon, type RefreshResult } from '@/lib/social/token-refresh'

export interface TokenRefreshContext {
  userId: string
  platform: string
  accountId?: string
}

async function getAccountTokens(userId: string, platform: string) {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await admin
    .from('social_accounts')
    .select('id, access_token_encrypted, refresh_token_encrypted, token_expires_at')
    .eq('user_id', userId)
    .eq('platform', platform)
    .single()
  return data
}

function getRefreshableToken(platform: string, account: { access_token_encrypted: string | null; refresh_token_encrypted: string | null }): string | null {
  if (platform === 'facebook') {
    return account.access_token_encrypted
  }
  return account.refresh_token_encrypted
}

export async function getValidAccessToken(ctx: TokenRefreshContext): Promise<{ token: string; refreshed: boolean } | { error: string; requiresReconnect: boolean }> {
  const account = await getAccountTokens(ctx.userId, ctx.platform)
  if (!account?.access_token_encrypted) {
    return { error: `No ${ctx.platform} account connected`, requiresReconnect: true }
  }

  if (account.token_expires_at && isTokenExpiringSoon(account.token_expires_at)) {
    const refreshableToken = getRefreshableToken(ctx.platform, account)
    if (refreshableToken) {
      console.log(`[WithTokenRefresh] ${ctx.platform} token expiring soon for user ${ctx.userId}, proactively refreshing`)
      const result = await refreshAccessToken(ctx.platform, ctx.userId, refreshableToken)
      if (result.success && result.newAccessToken) {
        return { token: result.newAccessToken, refreshed: true }
      }
      if (result.requiresReconnect) {
        return { error: result.error || 'Token expired', requiresReconnect: true }
      }
    }
  }

  const token = await decryptToken(account.access_token_encrypted)
  return { token, refreshed: false }
}

export async function withTokenRefresh<T>(
  ctx: TokenRefreshContext,
  apiCall: (accessToken: string) => Promise<T>,
  isAuthError?: (error: unknown) => boolean
): Promise<{ data: T; refreshed: boolean } | { error: string; requiresReconnect: boolean }> {
  const tokenResult = await getValidAccessToken(ctx)
  if ('error' in tokenResult) {
    return tokenResult
  }

  try {
    const data = await apiCall(tokenResult.token)
    return { data, refreshed: tokenResult.refreshed }
  } catch (err) {
    const shouldRetry = isAuthError
      ? isAuthError(err)
      : isDefaultAuthError(err)

    if (!shouldRetry) {
      throw err
    }

    console.log(`[WithTokenRefresh] ${ctx.platform} API call got auth error, attempting token refresh for user ${ctx.userId}`)

    const account = await getAccountTokens(ctx.userId, ctx.platform)
    if (!account) {
      return { error: `No ${ctx.platform} account found`, requiresReconnect: true }
    }

    const refreshableToken = getRefreshableToken(ctx.platform, account)
    if (!refreshableToken) {
      return { error: `No refresh token available for ${ctx.platform}. Please reconnect.`, requiresReconnect: true }
    }

    const refreshResult = await refreshAccessToken(ctx.platform, ctx.userId, refreshableToken)
    if (!refreshResult.success || !refreshResult.newAccessToken) {
      return {
        error: refreshResult.error || 'Token refresh failed',
        requiresReconnect: refreshResult.requiresReconnect || false,
      }
    }

    try {
      const data = await apiCall(refreshResult.newAccessToken)
      return { data, refreshed: true }
    } catch (retryErr) {
      return {
        error: `API call failed after token refresh: ${(retryErr as Error).message}`,
        requiresReconnect: false,
      }
    }
  }
}

function isDefaultAuthError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    return msg.includes('401') ||
      msg.includes('unauthorized') ||
      msg.includes('token') && (msg.includes('expired') || msg.includes('invalid') || msg.includes('revoked'))
  }
  return false
}
