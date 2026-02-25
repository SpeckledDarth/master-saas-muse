import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const format = searchParams.get('format') || 'json'

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('affiliate_profiles')
      .select('display_name, legal_name')
      .eq('user_id', user.id)
      .maybeSingle()

    let taxInfo = null
    try {
      const taxResult = await admin
        .from('affiliate_tax_info')
        .select('legal_name, tax_id_type, tax_id_last4, address_line1, address_city, address_state, address_zip, address_country, form_type')
        .eq('affiliate_user_id', user.id)
        .maybeSingle()
      taxInfo = taxResult.data
    } catch {
      taxInfo = null
    }

    const startOfYear = `${year}-01-01`
    const endOfYear = `${year}-12-31T23:59:59.999Z`

    const { data: commissions, error } = await admin
      .from('affiliate_commissions')
      .select('commission_amount_cents, status, created_at')
      .eq('affiliate_user_id', user.id)
      .gte('created_at', startOfYear)
      .lte('created_at', endOfYear)

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ year, grossEarnings: 0, numberOfPayments: 0, largestPayment: 0, monthlyBreakdown: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: payouts } = await admin
      .from('affiliate_payouts')
      .select('amount_cents, status, processed_at, created_at')
      .eq('affiliate_user_id', user.id)
      .gte('created_at', startOfYear)
      .lte('created_at', endOfYear)
      .in('status', ['completed', 'paid', 'processed'])

    const items = commissions || []
    const payoutItems = payouts || []

    let grossEarnings = 0
    let largestCommission = 0
    const monthlyTotals: Record<number, number> = {}

    for (let m = 0; m < 12; m++) monthlyTotals[m] = 0

    for (const c of items) {
      const amt = c.commission_amount_cents || 0
      grossEarnings += amt
      if (amt > largestCommission) largestCommission = amt
      const month = new Date(c.created_at).getMonth()
      monthlyTotals[month] += amt
    }

    let totalPaid = 0
    let largestPayout = 0
    for (const p of payoutItems) {
      const amt = p.amount_cents || 0
      totalPaid += amt
      if (amt > largestPayout) largestPayout = amt
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyBreakdown = monthNames.map((name, i) => ({
      month: name,
      earnings: monthlyTotals[i],
    }))

    const availableYears: number[] = []
    const { data: allCommissions } = await admin
      .from('affiliate_commissions')
      .select('created_at')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    if (allCommissions && allCommissions.length > 0) {
      const firstYear = new Date(allCommissions[0].created_at).getFullYear()
      const currentYear = new Date().getFullYear()
      for (let y = firstYear; y <= currentYear; y++) {
        availableYears.push(y)
      }
    } else {
      availableYears.push(new Date().getFullYear())
    }

    const affiliateName = taxInfo?.legal_name || profile?.legal_name || profile?.display_name || user.email || 'Affiliate'
    const requires1099 = grossEarnings >= 60000

    const summary = {
      year,
      affiliateName,
      email: user.email,
      taxInfo: taxInfo ? {
        legalName: taxInfo.legal_name,
        taxIdType: taxInfo.tax_id_type,
        taxIdLast4: taxInfo.tax_id_last4,
        address: [taxInfo.address_line1, taxInfo.address_city, taxInfo.address_state, taxInfo.address_zip, taxInfo.address_country].filter(Boolean).join(', '),
        formType: taxInfo.form_type,
      } : null,
      grossEarnings,
      totalPaid,
      numberOfCommissions: items.length,
      numberOfPayouts: payoutItems.length,
      largestCommission,
      largestPayout,
      monthlyBreakdown,
      requires1099,
      availableYears,
    }

    if (format === 'html') {
      const html = generateTaxSummaryHTML(summary)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="tax-summary-${year}.html"`,
        },
      })
    }

    return NextResponse.json(summary)
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ year: new Date().getFullYear(), grossEarnings: 0, numberOfCommissions: 0, numberOfPayouts: 0, largestCommission: 0, largestPayout: 0, totalPaid: 0, monthlyBreakdown: [], availableYears: [new Date().getFullYear()] })
    }
    console.error('Tax summary error:', err)
    return NextResponse.json({ error: 'Failed to generate tax summary' }, { status: 500 })
  }
}

function generateTaxSummaryHTML(summary: any) {
  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const monthRows = summary.monthlyBreakdown
    .map((m: any) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${m.month} ${summary.year}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-weight:${m.earnings > 0 ? '600' : '400'};">${formatCents(m.earnings)}</td>
      </tr>
    `).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Summary ${summary.year}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 40px; color: #1a1a1a; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div style="max-width:600px;margin:0 auto;">
    <div style="margin-bottom:32px;">
      <h1 style="margin:0 0 4px 0;font-size:24px;">Annual Tax Summary</h1>
      <p style="margin:0;color:#666;font-size:14px;">Tax Year ${summary.year}</p>
      <p style="margin:8px 0 0 0;color:#666;font-size:13px;">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div style="padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Affiliate</p>
      <p style="margin:4px 0 0 0;font-size:16px;font-weight:600;">${summary.affiliateName}</p>
      ${summary.email ? `<p style="margin:2px 0 0 0;font-size:13px;color:#666;">${summary.email}</p>` : ''}
      ${summary.taxInfo ? `
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#666;">Tax ID: ***-**-${summary.taxInfo.taxIdLast4 || '****'} (${(summary.taxInfo.taxIdType || 'SSN').toUpperCase()})</p>
          ${summary.taxInfo.address ? `<p style="margin:2px 0 0 0;font-size:12px;color:#666;">${summary.taxInfo.address}</p>` : ''}
        </div>
      ` : ''}
    </div>

    <div style="display:flex;gap:16px;margin-bottom:24px;">
      <div style="flex:1;padding:16px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
        <p style="margin:0;font-size:12px;color:#666;">Gross Earnings</p>
        <p style="margin:4px 0 0 0;font-size:24px;font-weight:700;color:#16a34a;">${formatCents(summary.grossEarnings)}</p>
      </div>
      <div style="flex:1;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#666;">Total Paid Out</p>
        <p style="margin:4px 0 0 0;font-size:24px;font-weight:700;">${formatCents(summary.totalPaid)}</p>
      </div>
    </div>

    <div style="display:flex;gap:16px;margin-bottom:24px;">
      <div style="flex:1;padding:12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#666;">Commissions</p>
        <p style="margin:2px 0 0 0;font-size:18px;font-weight:600;">${summary.numberOfCommissions}</p>
      </div>
      <div style="flex:1;padding:12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#666;">Payouts</p>
        <p style="margin:2px 0 0 0;font-size:18px;font-weight:600;">${summary.numberOfPayouts}</p>
      </div>
      <div style="flex:1;padding:12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#666;">Largest Commission</p>
        <p style="margin:2px 0 0 0;font-size:18px;font-weight:600;">${formatCents(summary.largestCommission)}</p>
      </div>
    </div>

    <h3 style="font-size:15px;margin:0 0 12px 0;">Monthly Breakdown</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#666;border-bottom:2px solid #e5e7eb;">Month</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;font-weight:600;color:#666;border-bottom:2px solid #e5e7eb;">Earnings</th>
        </tr>
      </thead>
      <tbody>
        ${monthRows}
      </tbody>
      <tfoot>
        <tr style="background:#f9fafb;">
          <td style="padding:8px 12px;font-size:13px;font-weight:700;border-top:2px solid #e5e7eb;">Total</td>
          <td style="padding:8px 12px;font-size:15px;font-weight:700;text-align:right;border-top:2px solid #e5e7eb;">${formatCents(summary.grossEarnings)}</td>
        </tr>
      </tfoot>
    </table>

    ${summary.requires1099 ? `
      <div style="margin-top:20px;padding:12px 16px;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#92400e;">1099-NEC May Be Required</p>
        <p style="margin:4px 0 0 0;font-size:12px;color:#92400e;">Your gross earnings exceed $600 for this tax year. You may receive a 1099-NEC form for tax reporting purposes.</p>
      </div>
    ` : ''}

    <p style="margin:32px 0 0 0;font-size:11px;color:#999;text-align:center;">
      This summary is provided for reference only and does not constitute tax advice.<br>
      Please consult a tax professional for specific guidance on reporting affiliate income.
    </p>
  </div>
</body>
</html>`
}
