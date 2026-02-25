import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/service'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: userRole } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (userRole?.role !== 'admin') return null
  return { user, admin }
}

function generateReceiptHtml(data: {
  affiliateName: string
  amount: number
  payoutDate: string
  commissions: Array<{ description: string; amount: number }>
  batchId: string
}) {
  const commissionRows = data.commissions.map(c => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px;">${c.description}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; text-align: right;">$${(c.amount / 100).toFixed(2)}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payout Receipt</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px solid #f0f0f0;">
            <h1 style="color: #111; margin: 0 0 4px 0; font-size: 22px;">Payout Receipt</h1>
            <p style="color: #666; margin: 0; font-size: 14px;">Affiliate Program Payment Confirmation</p>
          </div>

          <p style="margin: 0 0 16px 0;">Hi ${data.affiliateName},</p>
          <p style="margin: 0 0 24px 0;">Your affiliate payout has been processed. Here are the details:</p>

          <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; font-size: 14px; color: #666;">Payout Date</td>
                <td style="padding: 4px 0; font-size: 14px; text-align: right; font-weight: 600;">${new Date(data.payoutDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-size: 14px; color: #666;">Batch Reference</td>
                <td style="padding: 4px 0; font-size: 14px; text-align: right; font-family: monospace;">${data.batchId.slice(0, 8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0 4px 0; font-size: 16px; font-weight: 700; border-top: 1px solid #e0e0e0;">Total Amount</td>
                <td style="padding: 8px 0 4px 0; font-size: 16px; font-weight: 700; text-align: right; border-top: 1px solid #e0e0e0; color: #16a34a;">$${(data.amount / 100).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          ${data.commissions.length > 0 ? `
            <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #333;">Commission Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr>
                  <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase; border-bottom: 2px solid #eee;">Description</th>
                  <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #666; text-transform: uppercase; border-bottom: 2px solid #eee;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${commissionRows}
              </tbody>
            </table>
          ` : ''}

          <p style="color: #666; font-size: 13px; margin: 24px 0 0 0; padding-top: 16px; border-top: 1px solid #eee;">
            If you have any questions about this payout, please contact our support team.
          </p>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 16px;">
          This is an automated receipt from the Affiliate Program.
        </p>
      </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { batch_id } = body

    if (!batch_id) {
      return NextResponse.json({ error: 'batch_id is required' }, { status: 400 })
    }

    const { data: batch, error: batchErr } = await auth.admin
      .from('affiliate_payout_batches')
      .select('*')
      .eq('id', batch_id)
      .maybeSingle()

    if (batchErr || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    const { data: payouts, error: payoutsErr } = await auth.admin
      .from('affiliate_payouts')
      .select('*')
      .eq('batch_id', batch_id)

    if (payoutsErr || !payouts || payouts.length === 0) {
      return NextResponse.json({ error: 'No payouts found for this batch' }, { status: 404 })
    }

    const affiliateIds = payouts.map((p: any) => p.affiliate_user_id).filter(Boolean)

    const { data: links } = await auth.admin
      .from('referral_links')
      .select('user_id, email, ref_code')
      .in('user_id', affiliateIds)

    const linkMap: Record<string, any> = {}
    for (const link of links || []) {
      linkMap[link.user_id] = link
    }

    let allCommissions: any[] = []
    try {
      const { data: commData } = await auth.admin
        .from('affiliate_commissions')
        .select('id, affiliate_user_id, commission_amount_cents, status, created_at')
        .in('affiliate_user_id', affiliateIds)
        .in('status', ['approved', 'paid'])

      allCommissions = commData || []
    } catch {}

    const commissionsByAffiliate: Record<string, any[]> = {}
    for (const c of allCommissions) {
      if (!commissionsByAffiliate[c.affiliate_user_id]) commissionsByAffiliate[c.affiliate_user_id] = []
      commissionsByAffiliate[c.affiliate_user_id].push(c)
    }

    let sentCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const payout of payouts) {
      const link = linkMap[payout.affiliate_user_id]
      if (!link?.email) {
        errors.push(`No email found for affiliate ${payout.affiliate_user_id}`)
        failedCount++
        continue
      }

      const affiliateCommissions = commissionsByAffiliate[payout.affiliate_user_id] || []
      const commissionDetails = affiliateCommissions.slice(0, 20).map((c: any) => ({
        description: `Commission #${c.id.slice(0, 8)} (${new Date(c.created_at).toLocaleDateString()})`,
        amount: c.commission_amount_cents,
      }))

      const html = generateReceiptHtml({
        affiliateName: link.ref_code || link.email.split('@')[0],
        amount: payout.amount_cents,
        payoutDate: batch.batch_date || batch.created_at,
        commissions: commissionDetails,
        batchId: batch_id,
      })

      const result = await sendEmail({
        to: link.email,
        subject: `Payout Receipt - $${(payout.amount_cents / 100).toFixed(2)}`,
        html,
      })

      if (result.success) {
        sentCount++
      } else {
        failedCount++
        errors.push(`Failed to send to ${link.email}: ${result.error}`)
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      totalPayouts: payouts.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err: any) {
    console.error('Payout receipt error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send payout receipts' }, { status: 500 })
  }
}
