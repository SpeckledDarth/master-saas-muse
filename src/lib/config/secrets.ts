import { createClient } from '@supabase/supabase-js'
import { ensureConfigSecretsTable } from './ensure-table'

const ALLOWED_KEYS = new Set([
  'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'XAI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY',
  'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_ORG', 'SENTRY_PROJECT',
  'NEXT_PUBLIC_PLAUSIBLE_DOMAIN', 'NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL',
  'TWITTER_API_KEY', 'TWITTER_API_SECRET', 'TWITTER_BEARER_TOKEN',
  'LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET',
  'INSTAGRAM_APP_ID', 'INSTAGRAM_APP_SECRET',
  'YOUTUBE_API_KEY', 'YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET',
  'FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET',
  'TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET',
  'REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET',
  'PINTEREST_APP_ID', 'PINTEREST_APP_SECRET',
  'SNAPCHAT_CLIENT_ID', 'SNAPCHAT_CLIENT_SECRET',
  'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_BOT_TOKEN',
  'SESSION_SECRET',
])

export function isAllowedKey(key: string): boolean {
  return ALLOWED_KEYS.has(key)
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getDbSecret(keyName: string): Promise<string | null> {
  try {
    await ensureConfigSecretsTable()
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from('config_secrets')
      .select('encrypted_value')
      .eq('key_name', keyName)
      .maybeSingle()
    return data?.encrypted_value || null
  } catch {
    return null
  }
}

export async function getAllDbSecrets(): Promise<Record<string, string>> {
  try {
    await ensureConfigSecretsTable()
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from('config_secrets')
      .select('key_name, encrypted_value')
    if (!data) return {}
    const result: Record<string, string> = {}
    for (const row of data) {
      result[row.key_name] = row.encrypted_value
    }
    return result
  } catch {
    return {}
  }
}

export async function setDbSecret(keyName: string, value: string, updatedBy?: string): Promise<boolean> {
  if (!isAllowedKey(keyName)) return false
  try {
    await ensureConfigSecretsTable()
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('config_secrets')
      .upsert({
        key_name: keyName,
        encrypted_value: value,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy || null,
      }, { onConflict: 'key_name' })
    if (error) {
      console.error('[ConfigSecrets] Error saving:', error.message)
      return false
    }
    process.env[keyName] = value
    return true
  } catch (err) {
    console.error('[ConfigSecrets] Error saving:', err)
    return false
  }
}

export async function deleteDbSecret(keyName: string): Promise<boolean> {
  if (!isAllowedKey(keyName)) return false
  try {
    await ensureConfigSecretsTable()
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('config_secrets')
      .delete()
      .eq('key_name', keyName)
    if (error) {
      console.error('[ConfigSecrets] Error deleting:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('[ConfigSecrets] Error deleting:', err)
    return false
  }
}

export async function getConfigValue(keyName: string): Promise<string | undefined> {
  const dbValue = await getDbSecret(keyName)
  if (dbValue) {
    process.env[keyName] = dbValue
    return dbValue
  }

  const envValue = process.env[keyName]
  if (envValue) return envValue

  return undefined
}

export async function loadDbSecretsIntoEnv(): Promise<number> {
  const secrets = await getAllDbSecrets()
  let count = 0
  for (const [key, value] of Object.entries(secrets)) {
    if (!process.env[key]) {
      process.env[key] = value
      count++
    }
  }
  return count
}
