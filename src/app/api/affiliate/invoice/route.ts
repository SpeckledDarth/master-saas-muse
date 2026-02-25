import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const payoutId = searchParams.get('payoutId')

    if (!payoutId) {
      return NextResponse.json({ error: 'payoutId parameter is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: payout, error: payoutError } = await admin
      .from('affiliate_payouts')
      .select('*')
      .eq('id', payoutId)
      .eq('affiliate_user_id', user.id)
      .maybeSingle()

    if (payoutError || !payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    const { data: profile } = await admin
      .from('affiliate_profiles')
      .select('display_name, legal_name')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: link } = await admin
      .from('referral_links')
      .select('ref_code')
      .eq('user_id', user.id)
      .maybeSingle()

    let taxInfo = null
    try {
      const result = await admin
        .from('affiliate_tax_info')
        .select('legal_name, address_line1, address_city, address_state, address_zip, address_country')
        .eq('affiliate_user_id', user.id)
        .maybeSingle()
      taxInfo = result.data
    } catch {}

    const { data: commissions } = await admin
      .from('affiliate_commissions')
      .select('id, invoice_amount_cents, commission_rate, commission_amount_cents, status, created_at')
      .eq('affiliate_user_id', user.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: true })

    const payoutDate = payout.processed_at || payout.created_at
    const affiliateName = taxInfo?.legal_name || profile?.legal_name || profile?.display_name || user.email || 'Affiliate'
    const refCode = link?.ref_code || ''
    const invoiceNumber = `INV-${refCode.toUpperCase()}-${new Date(payoutDate).getFullYear()}${String(new Date(payoutDate).getMonth() + 1).padStart(2, '0')}${String(new Date(payoutDate).getDate()).padStart(2, '0')}`

    const address = taxInfo
      ? [taxInfo.address_line1, taxInfo.address_city, taxInfo.address_state, taxInfo.address_zip, taxInfo.address_country].filter(Boolean).join(', ')
      : ''

    const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 40px; color: #1a1a1a; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div style="max-width:700px;margin:0 auto;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
      <div>
        <h1 style="margin:0 0 4px 0;font-size:28px;font-weight:700;">INVOICE</h1>
        <p style="margin:0;color:#666;font-size:14px;">${invoiceNumber}</p>
      </div>
      <div style="text-align:right;">
        <p style="margin:0;font-size:14px;font-weight:600;">Date: ${formatDate(payoutDate)}</p>
        <p style="margin:4px 0 0 0;color:#666;font-size:13px;">Status: ${payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}</p>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-bottom:32px;">
      <div>
        <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#999;">From</p>
        <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;">${affiliateName}</p>
        ${address ? `<p style="margin:2px 0 0 0;font-size:13px;color:#666;">${address}</p>` : ''}
        <p style="margin:2px 0 0 0;font-size:13px;color:#666;">${user.email}</p>
        <p style="margin:2px 0 0 0;font-size:13px;color:#666;">Ref Code: ${refCode}</p>
      </div>
      <div style="text-align:right;">
        <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#999;">To</p>
        <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;">PassivePost</p>
        <p style="margin:2px 0 0 0;font-size:13px;color:#666;">Affiliate Program</p>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#666;border-bottom:2px solid #e5e7eb;">Description</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#666;border-bottom:2px solid #e5e7eb;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-size:14px;">
            Affiliate Commission Payout
            <br><span style="font-size:12px;color:#666;">Method: ${payout.method || 'Manual'}</span>
            ${payout.notes ? `<br><span style="font-size:12px;color:#666;">Notes: ${payout.notes}</span>` : ''}
          </td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;font-weight:600;">
            ${formatCents(payout.amount_cents)}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr style="background:#f9fafb;">
          <td style="padding:12px;font-size:15px;font-weight:700;border-top:2px solid #e5e7eb;">Total</td>
          <td style="padding:12px;font-size:18px;font-weight:700;text-align:right;border-top:2px solid #e5e7eb;">${formatCents(payout.amount_cents)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="padding:16px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#16a34a;font-weight:600;">
        ${payout.status === 'paid' || payout.status === 'completed' || payout.status === 'processed' ? 'Payment Received' : 'Payment Pending'}
      </p>
      <p style="margin:4px 0 0 0;font-size:12px;color:#666;">
        ${payout.processed_at ? `Processed on ${formatDate(payout.processed_at)}` : 'Awaiting processing'}
      </p>
    </div>

    <p style="margin:32px 0 0 0;font-size:11px;color:#999;text-align:center;">
      This invoice was auto-generated for record-keeping purposes.<br>
      Generated on ${formatDate(new Date().toISOString())}
    </p>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${invoiceNumber}.html"`,
      },
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Not available' }, { status: 404 })
    }
    console.error('Invoice generation error:', err)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}
