import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function verifyAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const adminClient = createAdminClient()

  const [{ data: userRole }, { data: teamMember }] = await Promise.all([
    adminClient.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
    adminClient.from('organization_members').select('role').eq('user_id', user.id).eq('organization_id', 1).maybeSingle(),
  ])

  const isAdmin = userRole?.role === 'admin'
  const canAccess = isAdmin || teamMember?.role === 'owner' || teamMember?.role === 'manager'

  if (!canAccess) {
    return { error: NextResponse.json({ error: 'Access denied' }, { status: 403 }) }
  }

  return { user, adminClient, isAdmin }
}

export function isErrorResponse(result: any): result is { error: NextResponse } {
  return 'error' in result && result.error instanceof NextResponse
}

export function safeTableError(error: any): boolean {
  return error?.code === '42P01' || error?.code === 'PGRST205'
}
