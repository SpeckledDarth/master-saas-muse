import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'commissions'
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const format = searchParams.get('format') || 'csv'

    const admin = createAdminClient()

    let csv = ''
    let filename = ''

    if (type === 'commissions') {
      let query = admin.from('affiliate_commissions')
        .select('id, referral_id, invoice_amount_cents, commission_rate, commission_amount_cents, status, created_at')
        .eq('affiliate_user_id', user.id)
        .order('created_at', { ascending: true })

      if (startDate) query = query.gte('created_at', startDate)
      if (endDate) query = query.lte('created_at', endDate + 'T23:59:59.999Z')

      const { data: commissions } = await query
      const items = commissions || []

      csv = 'Date,Invoice Amount,Commission Rate,Commission Amount,Status\n'
      for (const c of items) {
        csv += `${new Date(c.created_at).toISOString().split('T')[0]},${(c.invoice_amount_cents / 100).toFixed(2)},${c.commission_rate}%,${(c.commission_amount_cents / 100).toFixed(2)},${c.status}\n`
      }

      const total = items.reduce((s, c) => s + c.commission_amount_cents, 0)
      csv += `\nTotal,,,"${(total / 100).toFixed(2)}",${items.length} records\n`

      filename = `commissions-export-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'referrals') {
      const { data: referrals } = await admin.from('affiliate_referrals')
        .select('id, status, source_tag, created_at')
        .eq('affiliate_user_id', user.id)
        .order('created_at', { ascending: true })

      const items = referrals || []

      csv = 'Date,Referral ID,Status,Source Tag\n'
      for (const r of items) {
        csv += `${new Date(r.created_at).toISOString().split('T')[0]},${r.id},${r.status},${r.source_tag || ''}\n`
      }

      csv += `\nTotal: ${items.length} referrals\n`
      filename = `referrals-export-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'payouts') {
      const { data: payouts } = await admin.from('affiliate_payouts')
        .select('id, amount_cents, method, status, processed_at, created_at')
        .eq('affiliate_user_id', user.id)
        .order('created_at', { ascending: true })

      const items = payouts || []

      csv = 'Date,Amount,Method,Status,Processed Date\n'
      for (const p of items) {
        csv += `${new Date(p.created_at).toISOString().split('T')[0]},${(p.amount_cents / 100).toFixed(2)},${p.method},${p.status},${p.processed_at ? new Date(p.processed_at).toISOString().split('T')[0] : ''}\n`
      }

      const total = items.reduce((s, p) => s + p.amount_cents, 0)
      csv += `\nTotal,${(total / 100).toFixed(2)},,${items.length} payouts\n`
      filename = `payouts-export-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'bookkeeping') {
      const [commissionsRes, payoutsRes] = await Promise.all([
        admin.from('affiliate_commissions')
          .select('id, invoice_amount_cents, commission_rate, commission_amount_cents, status, created_at')
          .eq('affiliate_user_id', user.id)
          .order('created_at', { ascending: true }),
        admin.from('affiliate_payouts')
          .select('id, amount_cents, method, status, processed_at, created_at')
          .eq('affiliate_user_id', user.id)
          .order('created_at', { ascending: true }),
      ])

      const commissions = commissionsRes.data || []
      const payouts = payoutsRes.data || []

      csv = 'Date,Type,Description,Amount,Category,Status\n'

      for (const c of commissions) {
        const date = new Date(c.created_at).toISOString().split('T')[0]
        csv += `${date},Income,Commission at ${c.commission_rate}% on $${(c.invoice_amount_cents / 100).toFixed(2)} invoice,${(c.commission_amount_cents / 100).toFixed(2)},Affiliate Commission,${c.status}\n`
      }

      for (const p of payouts) {
        const date = new Date(p.processed_at || p.created_at).toISOString().split('T')[0]
        if (['paid', 'completed', 'processed'].includes(p.status)) {
          csv += `${date},Payout,Payout via ${p.method},${(p.amount_cents / 100).toFixed(2)},Payout Received,${p.status}\n`
        }
      }

      const totalIncome = commissions.reduce((s, c) => s + c.commission_amount_cents, 0)
      const totalPaid = payouts.filter(p => ['paid', 'completed', 'processed'].includes(p.status)).reduce((s, p) => s + p.amount_cents, 0)

      csv += `\nSummary\n`
      csv += `Total Income,,,"${(totalIncome / 100).toFixed(2)}",,\n`
      csv += `Total Paid Out,,,"${(totalPaid / 100).toFixed(2)}",,\n`
      csv += `Outstanding,,,"${((totalIncome - totalPaid) / 100).toFixed(2)}",,\n`
      csv += `\nGenerated: ${new Date().toISOString()}\n`

      filename = `bookkeeping-export-${new Date().toISOString().split('T')[0]}.csv`
    } else {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return new NextResponse('No data available', {
        headers: { 'Content-Type': 'text/csv' },
      })
    }
    console.error('Export CSV error:', err)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
