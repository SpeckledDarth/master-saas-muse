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

    const [invoicesRes, commissionsRes] = await Promise.all([
      admin.from('invoices').select('id, amount_cents, status, created_at, user_id'),
      admin.from('affiliate_commissions').select('id, affiliate_user_id, invoice_id, invoice_amount_cents, commission_amount_cents, status, created_at'),
    ])

    if (invoicesRes.error?.code === '42P01' || commissionsRes.error?.code === '42P01') {
      return NextResponse.json({
        attribution: {
          totalRevenue: 0,
          affiliateRevenue: 0,
          directRevenue: 0,
          affiliatePercentage: 0,
          totalCommissionsPaid: 0,
          totalCommissionsPending: 0,
          invoiceCount: 0,
          affiliateInvoiceCount: 0,
        }
      })
    }

    const invoices = invoicesRes.data || []
    const commissions = commissionsRes.data || []

    const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid' || inv.status === 'completed')
    const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.amount_cents || 0), 0)

    const affiliateLinkedUserIds = new Set<string>()
    const affiliateLinkedInvoiceIds = new Set<string>()
    for (const c of commissions) {
      if (c.invoice_id) affiliateLinkedInvoiceIds.add(c.invoice_id)
    }

    const affiliateRevenue = commissions.reduce((sum: number, c: any) => sum + (c.invoice_amount_cents || 0), 0)

    const directRevenue = Math.max(0, totalRevenue - affiliateRevenue)
    const affiliatePercentage = totalRevenue > 0 ? Math.round((affiliateRevenue / totalRevenue) * 100) : 0

    const totalCommissionsPaid = commissions
      .filter((c: any) => c.status === 'paid')
      .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

    const totalCommissionsPending = commissions
      .filter((c: any) => c.status === 'pending' || c.status === 'approved')
      .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

    return NextResponse.json({
      attribution: {
        totalRevenue,
        affiliateRevenue,
        directRevenue,
        affiliatePercentage,
        totalCommissionsPaid,
        totalCommissionsPending,
        invoiceCount: paidInvoices.length,
        affiliateInvoiceCount: affiliateLinkedInvoiceIds.size,
      }
    })
  } catch (error: any) {
    console.error('[Revenue Attribution API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch revenue attribution' }, { status: 500 })
  }
}
