import { createClient } from '@supabase/supabase-js'

let tableEnsured = false

export async function ensureConfigSecretsTable() {
  if (tableEnsured) return

  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await admin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS config_secrets (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          key_name text NOT NULL UNIQUE,
          encrypted_value text NOT NULL,
          updated_at timestamptz DEFAULT now(),
          updated_by text
        );
        CREATE INDEX IF NOT EXISTS idx_config_secrets_key_name ON config_secrets(key_name);
      `
    })

    if (error) {
      console.warn('[ConfigSecrets] Could not ensure table via RPC:', error.message)
      const { error: insertError } = await admin
        .from('config_secrets')
        .select('id')
        .limit(1)
      if (insertError && insertError.message.includes('does not exist')) {
        console.warn('[ConfigSecrets] Table does not exist - please create it manually in your Supabase dashboard')
      }
    }
    tableEnsured = true
  } catch (err) {
    console.warn('[ConfigSecrets] ensureConfigSecretsTable: RPC not available')
  }
}
