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

    const fullRow: Record<string, any> = {
      user_id: entry.admin_user_id,
      action,
      target_type: `affiliate_${entry.entity_type}`,
      target_id: entry.entity_id || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    }

    const { error } = await admin.from('audit_logs').insert(fullRow)

    if (error) {
      if (error.message?.includes('target_type') || error.message?.includes('target_id') || error.message?.includes('metadata') || error.message?.includes('column')) {
        const minimalRow: Record<string, any> = {
          user_id: entry.admin_user_id,
          action,
        }

        const columnsToTry = ['target_type', 'target_id', 'metadata', 'details']
        const availableFields: Record<string, any> = {
          target_type: `affiliate_${entry.entity_type}`,
          target_id: entry.entity_id || null,
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
          details: Object.keys(metadata).length > 0 ? metadata : null,
        }

        for (const col of columnsToTry) {
          const tryRow = { ...minimalRow, [col]: availableFields[col] }
          const { error: tryErr } = await admin.from('audit_logs').insert(tryRow)
          if (!tryErr) return
        }

        const { error: minErr } = await admin.from('audit_logs').insert(minimalRow)
        if (minErr) {
          console.error('[Audit] Failed minimal insert:', minErr.message)
        }
      } else {
        console.error('[Audit] Failed to log audit event:', error.message)
      }
    }
  } catch (err) {
    console.error('[Audit] Failed to log audit event:', err)
  }
}
