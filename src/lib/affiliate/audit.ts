import { createAdminClient } from '@/lib/supabase/admin'

export interface AuditLogEntry {
  admin_user_id: string
  admin_email?: string
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'send' | 'soft_delete' | 'restore'
  entity_type: string
  entity_id?: string
  entity_name?: string
  details?: Record<string, any>
}

export async function logAuditEvent(entry: AuditLogEntry) {
  try {
    const admin = createAdminClient()
    await admin.from('affiliate_audit_log').insert({
      admin_user_id: entry.admin_user_id,
      admin_email: entry.admin_email || null,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      entity_name: entry.entity_name || null,
      details: entry.details || {},
    })
  } catch (err) {
    console.error('[Audit] Failed to log audit event:', err)
  }
}
