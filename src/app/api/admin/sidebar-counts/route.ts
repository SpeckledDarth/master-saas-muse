import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const EMPTY_COUNTS = { openTickets: 0, newUsersToday: 0, failedPayments: 0, pendingApplications: 0, pendingPayouts: 0 }

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(EMPTY_COUNTS)
    }

    const adminClient = createAdminClient()

    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: teamMember } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', 1)
      .maybeSingle()

    const isAdmin = userRole?.role === 'admin'
    const canView = isAdmin || teamMember?.role === 'owner' || teamMember?.role === 'manager'

    if (!canView) {
      return NextResponse.json(EMPTY_COUNTS)
    }

    let openTickets = 0
    let newUsersToday = 0
    let failedPayments = 0
    let pendingApplications = 0
    let pendingPayouts = 0

    try {
      const { count, error } = await adminClient
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')

      if (!error && count !== null) {
        openTickets = count
      }
    } catch {}

    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { data: authData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 })
      if (authData?.users) {
        newUsersToday = authData.users.filter(u => new Date(u.created_at) >= todayStart).length
      }
    } catch {}

    try {
      const { count, error } = await adminClient
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .in('status', ['failed', 'uncollectible'])

      if (!error && count !== null) {
        failedPayments = count
      }
    } catch {}

    try {
      const { count, error } = await adminClient
        .from('affiliate_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (!error && count !== null) {
        pendingApplications = count
      }
    } catch {}

    try {
      const { count, error } = await adminClient
        .from('affiliate_payout_batches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (!error && count !== null) {
        pendingPayouts = count
      }
    } catch {}

    return NextResponse.json({ openTickets, newUsersToday, failedPayments, pendingApplications, pendingPayouts })
  } catch {
    return NextResponse.json(EMPTY_COUNTS)
  }
}
