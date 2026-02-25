import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: userRole } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: teamMember } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', 1)
      .maybeSingle()

    const isAdmin = userRole?.role === 'admin' || teamMember?.role === 'owner' || teamMember?.role === 'manager'
    if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    let subscriptionsRes: any = { data: [] }
    let commissionsRes: any = { data: [] }
    let payoutsRes: any = { data: [] }
    let refundsRes: any = { data: [] }
    try {
      [subscriptionsRes, commissionsRes, payoutsRes, refundsRes] = await Promise.all([
        admin.from('invoices').select('amount_cents, status, created_at'),
        admin.from('affiliate_commissions').select('commission_amount_cents, status, created_at'),
        admin.from('affiliate_payouts').select('total_amount_cents, status, created_at'),
        admin.from('invoices').select('amount_cents').eq('status', 'refunded'),
      ])
    } catch {
      // Tables may not exist yet — use empty defaults
    }

    const invoices = (subscriptionsRes as any)?.data || []
    const commissions = (commissionsRes as any)?.data || []
    const payouts = (payoutsRes as any)?.data || []
    const refunds = (refundsRes as any)?.data || []

    const grossRevenue = invoices
      .filter((i: any) => i.status === 'paid' || i.status === 'completed')
      .reduce((sum: number, i: any) => sum + (i.amount_cents || 0), 0)

    const totalRefunds = refunds.reduce((sum: number, r: any) => sum + (r.amount_cents || 0), 0)

    const netRevenue = grossRevenue - totalRefunds

    const totalCommissions = commissions
      .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

    const paidCommissions = commissions
      .filter((c: any) => c.status === 'paid')
      .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

    const pendingCommissions = commissions
      .filter((c: any) => c.status === 'pending' || c.status === 'approved')
      .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

    const totalPayouts = payouts
      .filter((p: any) => p.status === 'completed' || p.status === 'paid')
      .reduce((sum: number, p: any) => sum + (p.total_amount_cents || 0), 0)

    const netAfterCommissions = netRevenue - totalCommissions

    const now = new Date()
    const months: any[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const label = monthStart.toLocaleString('en-US', { month: 'short', year: '2-digit' })

      const monthRevenue = invoices
        .filter((inv: any) => {
          const d = new Date(inv.created_at)
          return (inv.status === 'paid' || inv.status === 'completed') && d >= monthStart && d <= monthEnd
        })
        .reduce((sum: number, inv: any) => sum + (inv.amount_cents || 0), 0)

      const monthCommissions = commissions
        .filter((c: any) => {
          const d = new Date(c.created_at)
          return d >= monthStart && d <= monthEnd
        })
        .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

      months.push({
        label,
        revenue: monthRevenue,
        commissions: monthCommissions,
        net: monthRevenue - monthCommissions,
      })
    }

    return NextResponse.json({
      waterfall: {
        grossRevenue,
        refunds: totalRefunds,
        netRevenue,
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        totalPayouts,
        netAfterCommissions,
        months,
      },
    })
  } catch (err) {
    console.error('Revenue waterfall error:', err)
    return NextResponse.json({
      waterfall: {
        grossRevenue: 0,
        refunds: 0,
        netRevenue: 0,
        totalCommissions: 0,
        paidCommissions: 0,
        pendingCommissions: 0,
        totalPayouts: 0,
        netAfterCommissions: 0,
        months: [],
      },
    })
  }
}
