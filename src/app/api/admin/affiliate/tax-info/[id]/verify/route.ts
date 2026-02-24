import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/affiliate/audit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { id } = await params

    const { data: existing } = await admin
      .from('affiliate_tax_info')
      .select('id, affiliate_user_id, legal_name, verified')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Tax info not found' }, { status: 404 })
    }

    const { error } = await admin
      .from('affiliate_tax_info')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAuditEvent({
      admin_user_id: user.id,
      admin_email: user.email || undefined,
      action: 'approve',
      entity_type: 'tax_info',
      entity_id: id,
      entity_name: existing.legal_name,
      details: { affiliate_user_id: existing.affiliate_user_id },
    })

    const { createNotification } = await import('@/lib/affiliate')
    await createNotification(
      existing.affiliate_user_id,
      'Tax Info Verified',
      'Your tax information has been verified by an administrator.',
      'success',
      '/affiliate/dashboard?tab=account'
    ).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin tax verify error:', err)
    return NextResponse.json({ error: 'Failed to verify tax info' }, { status: 500 })
  }
}
