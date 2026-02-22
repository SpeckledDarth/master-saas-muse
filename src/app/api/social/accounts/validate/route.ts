import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPlatformClient, type SocialPlatform } from '@/lib/social/client'
import { decryptToken } from '@/lib/social/crypto'
import { refreshAccessToken, isTokenExpiringSoon } from '@/lib/social/token-refresh'

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

export async function POST() {
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
    const { data: accounts, error } = await admin
      .from('social_accounts')
      .select('id, platform, access_token_encrypted, refresh_token_encrypted, token_expires_at')
      .eq('user_id', user.id)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({ results: [], note: 'Social accounts table has not been created yet.' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ results: [], message: 'No connected accounts to validate' })
    }

    const results = await Promise.all(
      accounts.map(async (account) => {
        const client = getPlatformClient(account.platform as SocialPlatform)
        let token = account.access_token_encrypted ? await decryptToken(account.access_token_encrypted) : ''
        let refreshed = false
        let validation = await client.validateToken(token)

        if (!validation.valid || isTokenExpiringSoon(account.token_expires_at)) {
          const refreshableToken = account.platform === 'facebook'
            ? account.access_token_encrypted
            : account.refresh_token_encrypted

          if (refreshableToken) {
            console.log(`[Validate] Attempting token refresh for ${account.platform} (account ${account.id})`)
            const refreshResult = await refreshAccessToken(account.platform, user.id, refreshableToken)
            if (refreshResult.success && refreshResult.newAccessToken) {
              token = refreshResult.newAccessToken
              refreshed = true
              validation = await client.validateToken(token)
            } else {
              const errorMsg = refreshResult.requiresReconnect
                ? `Token expired — please reconnect your ${account.platform} account`
                : refreshResult.error || 'Token refresh failed'

              await admin
                .from('social_accounts')
                .update({
                  is_valid: false,
                  last_validated_at: new Date().toISOString(),
                  last_error: errorMsg,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', account.id)

              return {
                id: account.id,
                platform: account.platform,
                is_valid: false,
                refreshed: false,
                requires_reconnect: refreshResult.requiresReconnect || false,
                error: errorMsg,
              }
            }
          }
        }

        await admin
          .from('social_accounts')
          .update({
            is_valid: validation.valid,
            last_validated_at: new Date().toISOString(),
            last_error: validation.error || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', account.id)

        return {
          id: account.id,
          platform: account.platform,
          is_valid: validation.valid,
          refreshed,
          requires_reconnect: !validation.valid && !refreshed,
          error: validation.error || null,
        }
      })
    )

    return NextResponse.json({ results })
  } catch (err) {
    return NextResponse.json({ error: 'Could not validate accounts' }, { status: 500 })
  }
}
