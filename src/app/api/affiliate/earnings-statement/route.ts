import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const format = searchParams.get('format') || 'json'

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start and end date parameters are required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: link } = await admin
      .from('referral_links')
      .select('ref_code')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: profile } = await admin
      .from('affiliate_profiles')
      .select('display_name, legal_name')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: commissions, error } = await admin
      .from('affiliate_commissions')
      .select('id, invoice_amount_cents, commission_rate, commission_amount_cents, status, created_at')
      .eq('affiliate_user_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59.999Z')
      .order('created_at', { ascending: true })

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ commissions: [], totals: { gross: 0, pending: 0, approved: 0, paid: 0, count: 0 } })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items = commissions || []
    let pending = 0, approved = 0, paid = 0, gross = 0
    for (const c of items) {
      const amt = c.commission_amount_cents || 0
      gross += amt
      if (c.status === 'pending') pending += amt
      else if (c.status === 'approved') approved += amt
      else if (c.status === 'paid') paid += amt
    }

    const totals = { gross, pending, approved, paid, count: items.length }
    const affiliateName = profile?.legal_name || profile?.display_name || user.email || 'Affiliate'
    const refCode = link?.ref_code || ''

    if (format === 'html') {
      const html = generateStatementHTML(affiliateName, refCode, startDate, endDate, items, totals)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="earnings-statement-${startDate}-to-${endDate}.html"`,
        },
      })
    }

    return NextResponse.json({
      affiliate: { name: affiliateName, refCode, email: user.email },
      period: { start: startDate, end: endDate },
      commissions: items,
      totals,
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ commissions: [], totals: { gross: 0, pending: 0, approved: 0, paid: 0, count: 0 } })
    }
    console.error('Earnings statement error:', err)
    return NextResponse.json({ error: 'Failed to generate earnings statement' }, { status: 500 })
  }
}

function generateStatementHTML(
  name: string,
  refCode: string,
  startDate: string,
  endDate: string,
  commissions: any[],
  totals: { gross: number; pending: number; approved: number; paid: number; count: number }
) {
  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const rows = commissions.map(c => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${formatDate(c.created_at)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${formatCents(c.invoice_amount_cents)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${c.commission_rate}%</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600;">${formatCents(c.commission_amount_cents)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-transform:capitalize;">${c.status}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Earnings Statement</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 40px; color: #1a1a1a; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div style="max-width:700px;margin:0 auto;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
      <div>
        <h1 style="margin:0 0 4px 0;font-size:24px;">Earnings Statement</h1>
        <p style="margin:0;color:#666;font-size:14px;">
          ${formatDate(startDate)} &mdash; ${formatDate(endDate)}
        </p>
      </div>
      <div style="text-align:right;">
        <p style="margin:0;font-size:14px;font-weight:600;">${name}</p>
        <p style="margin:2px 0 0 0;color:#666;font-size:13px;">Ref: ${refCode}</p>
        <p style="margin:2px 0 0 0;color:#666;font-size:13px;">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
      </div>
    </div>

    <div style="display:flex;gap:16px;margin-bottom:24px;">
      <div style="flex:1;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#666;">Total Commissions</p>
        <p style="margin:4px 0 0 0;font-size:22px;font-weight:700;">${formatCents(totals.gross)}</p>
      </div>
      <div style="flex:1;padding:16px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
        <p style="margin:0;font-size:12px;color:#666;">Paid</p>
        <p style="margin:4px 0 0 0;font-size:22px;font-weight:700;color:#16a34a;">${formatCents(totals.paid)}</p>
      </div>
      <div style="flex:1;padding:16px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a;">
        <p style="margin:0;font-size:12px;color:#666;">Pending</p>
        <p style="margin:4px 0 0 0;font-size:22px;font-weight:700;color:#ca8a04;">${formatCents(totals.pending)}</p>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#666;border-bottom:2px solid #e5e7eb;">Date</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#666;border-bottom:2px solid #e5e7eb;">Invoice</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#666;border-bottom:2px solid #e5e7eb;">Rate</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#666;border-bottom:2px solid #e5e7eb;">Commission</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#666;border-bottom:2px solid #e5e7eb;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5" style="padding:24px;text-align:center;color:#999;font-size:14px;">No commissions in this period</td></tr>'}
      </tbody>
      <tfoot>
        <tr style="background:#f9fafb;">
          <td colspan="3" style="padding:10px 12px;font-size:13px;font-weight:600;border-top:2px solid #e5e7eb;">
            Total (${totals.count} commission${totals.count !== 1 ? 's' : ''})
          </td>
          <td style="padding:10px 12px;font-size:15px;font-weight:700;border-top:2px solid #e5e7eb;">${formatCents(totals.gross)}</td>
          <td style="padding:10px 12px;border-top:2px solid #e5e7eb;"></td>
        </tr>
      </tfoot>
    </table>

    <p style="margin:32px 0 0 0;font-size:11px;color:#999;text-align:center;">
      This statement is for informational purposes only and does not constitute a tax document.
    </p>
  </div>
</body>
</html>`
}
