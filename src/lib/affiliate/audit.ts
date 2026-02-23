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
    const action = `affiliate_${entry.entity_type}_${entry.action}`
    const metadata: Record<string, any> = {}
    if (entry.admin_email) metadata.admin_email = entry.admin_email
    if (entry.entity_name) metadata.entity_name = entry.entity_name
    if (entry.details && Object.keys(entry.details).length > 0) metadata.details = entry.details

    await admin.from('audit_logs').insert({
      user_id: entry.admin_user_id,
      action,
      target_type: `affiliate_${entry.entity_type}`,
      target_id: entry.entity_id || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    })
  } catch (err) {
    console.error('[Audit] Failed to log audit event:', err)
  }
}
