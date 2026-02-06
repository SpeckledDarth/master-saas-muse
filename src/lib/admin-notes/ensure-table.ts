import { createAdminClient } from '@/lib/supabase/admin'

export async function ensureAdminNotesTable() {
  const adminClient = createAdminClient()

  try {
    const { error } = await adminClient.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS admin_notes (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id uuid NOT NULL,
          note text NOT NULL,
          created_by uuid NOT NULL,
          created_at timestamptz DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_admin_notes_user_id ON admin_notes(user_id);
      `
    })

    if (error) {
      console.warn('Could not ensure admin_notes table via RPC:', error.message)
    }
  } catch (err) {
    console.warn('ensureAdminNotesTable: RPC not available, table must be created manually or will be created on first use')
  }
}
