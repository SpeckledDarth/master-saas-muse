import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: invoice } = await admin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const { data: settings } = await admin
      .from('organization_settings')
      .select('settings')
      .eq('app_id', 'default')
      .maybeSingle()

    const branding = settings?.settings?.branding || {}
    const appName = branding.appName || 'PassivePost'
    const supportEmail = branding.supportEmail || 'support@passivepost.com'
    const primaryColor = branding.primaryColor || '#6366f1'
    const logoUrl = branding.logoUrl || ''

    const amount = invoice.amount_cents ? (invoice.amount_cents / 100).toFixed(2) : (invoice.amount ? (invoice.amount / 100).toFixed(2) : '0.00')
    const invoiceDate = new Date(invoice.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    const invoiceNumber = invoice.invoice_number || `INV-${invoice.id.slice(0, 8).toUpperCase()}`

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <div style="background: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" style="max-height: 40px; margin-bottom: 24px;" />` : `<h1 style="color: ${primaryColor}; margin: 0 0 24px 0; font-size: 24px;">${appName}</h1>`}
            <h2 style="color: #333; margin: 0 0 8px 0;">Payment Receipt</h2>
            <p style="color: #666; margin: 0 0 24px 0;">Invoice ${invoiceNumber}</p>
            <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
              <tr style="border-bottom: 2px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #333;">Date</td>
                <td style="padding: 12px 0; text-align: right; color: #333;">${invoiceDate}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; color: #666;">${invoice.description || 'Subscription'}</td>
                <td style="padding: 12px 0; text-align: right; color: #333;">$${amount}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-weight: bold; font-size: 18px; color: ${primaryColor};">Total Paid</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 18px; color: ${primaryColor};">$${amount}</td>
              </tr>
            </table>
            <p style="color: #666; font-size: 13px;">Payment to: ${appName}</p>
            ${invoice.paid_at ? `<p style="color: #666; font-size: 13px;">Paid on: ${new Date(invoice.paid_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px; margin: 0;">
              Questions about this receipt? Contact us at
              <a href="mailto:${supportEmail}" style="color: ${primaryColor};">${supportEmail}</a>
            </p>
          </div>
        </body>
      </html>
    `

    try {
      const { sendEmail } = await import('@/lib/email/service')
      const result = await sendEmail({
        to: user.email!,
        subject: `${appName} Payment Receipt - ${invoiceNumber}`,
        html: receiptHtml,
      })

      if (result.success) {
        return NextResponse.json({ success: true, message: 'Receipt sent to your email' })
      } else {
        return NextResponse.json({ error: result.error || 'Failed to send receipt' }, { status: 500 })
      }
    } catch {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
    }
  } catch (err) {
    console.error('Branded receipt error:', err)
    return NextResponse.json({ error: 'Failed to send receipt' }, { status: 500 })
  }
}
