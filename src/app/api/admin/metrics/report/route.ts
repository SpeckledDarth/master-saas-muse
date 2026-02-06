import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addMetricsReportJob } from '@/lib/queue'
import { sendEmail } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { reportType = 'weekly', email } = body
    const recipientEmail = email || user.email

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No email address' }, { status: 400 })
    }

    const jobId = await addMetricsReportJob({
      reportType,
      recipientEmail,
      requestedBy: user.id,
    })

    if (jobId) {
      return NextResponse.json({ success: true, jobId, message: 'Report queued for delivery' })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const periodLabel = reportType === 'weekly' ? 'Weekly' : 'Monthly'

    await sendEmail({
      to: recipientEmail,
      subject: `${periodLabel} Metrics Report`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">${periodLabel} Metrics Report</h2>
          <p>Your ${periodLabel.toLowerCase()} metrics report is ready.</p>
          <p style="margin-top: 16px;">
            <a href="${baseUrl}/admin/metrics" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Full Dashboard
            </a>
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'Report sent' })
  } catch (error) {
    console.error('Metrics report error:', error)
    return NextResponse.json({ error: 'Failed to send report' }, { status: 500 })
  }
}
