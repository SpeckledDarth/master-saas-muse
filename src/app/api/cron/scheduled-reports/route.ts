import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: settings } = await admin
      .from('organization_settings')
      .select('settings')
      .eq('app_id', 'default')
      .maybeSingle()

    const security = settings?.settings?.security || {}
    const branding = settings?.settings?.branding || {}
    const appName = branding.appName || 'PassivePost'

    const body = await request.json().catch(() => ({}))
    const reportType = body.type || 'weekly'

    if (reportType === 'weekly' && !security.weeklyReportEnabled) {
      return NextResponse.json({ skipped: true, reason: 'Weekly reports disabled' })
    }
    if (reportType === 'monthly' && !security.monthlyReportEnabled) {
      return NextResponse.json({ skipped: true, reason: 'Monthly reports disabled' })
    }

    const { data: admins } = await admin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    if (!admins || admins.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'No admin users found' })
    }

    const adminIds = admins.map((a: any) => a.user_id)
    const adminEmails: string[] = []
    for (const id of adminIds) {
      const { data: authUser } = await admin.auth.admin.getUserById(id)
      if (authUser?.user?.email) {
        adminEmails.push(authUser.user.email)
      }
    }

    const now = new Date()
    const periodStart = reportType === 'weekly'
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const periodEnd = reportType === 'monthly'
      ? new Date(now.getFullYear(), now.getMonth(), 0)
      : now

    let usersRes: any = { data: { users: [] } }
    let invoicesRes: any = { data: [] }
    let commissionsRes: any = { data: [] }
    let ticketsRes: any = { data: [] }
    try {
      [usersRes, invoicesRes, commissionsRes, ticketsRes] = await Promise.all([
        admin.auth.admin.listUsers({ perPage: 1000 }),
        admin.from('invoices')
          .select('amount_cents, status, created_at')
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString()),
        admin.from('affiliate_commissions')
          .select('commission_amount_cents, status, created_at')
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString()),
        admin.from('support_tickets')
          .select('id, status, created_at')
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString()),
      ])
    } catch {
      // Tables may not exist yet — use empty defaults
    }

    const totalUsers = (usersRes as any)?.data?.users?.length || 0
    const newUsersInPeriod = ((usersRes as any)?.data?.users || [])
      .filter((u: any) => new Date(u.created_at) >= periodStart && new Date(u.created_at) <= periodEnd).length

    const invoices = (invoicesRes as any)?.data || []
    const paidInvoices = invoices.filter((i: any) => i.status === 'paid' || i.status === 'completed')
    const totalRevenue = paidInvoices.reduce((s: number, i: any) => s + (i.amount_cents || 0), 0)

    const commissions = (commissionsRes as any)?.data || []
    const totalCommissions = commissions.reduce((s: number, c: any) => s + (c.commission_amount_cents || 0), 0)

    const tickets = (ticketsRes as any)?.data || []
    const openTickets = tickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length

    const periodLabel = reportType === 'weekly' ? 'Weekly' : 'Monthly'
    const dateRange = `${periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">${appName} ${periodLabel} Report</h2>
          <p style="color: #666;">${dateRange}</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; font-weight: bold;">Total Users</td>
              <td style="padding: 10px; text-align: right;">${totalUsers}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; font-weight: bold;">New Users</td>
              <td style="padding: 10px; text-align: right;">+${newUsersInPeriod}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; font-weight: bold;">Revenue</td>
              <td style="padding: 10px; text-align: right;">$${(totalRevenue / 100).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; font-weight: bold;">Commissions</td>
              <td style="padding: 10px; text-align: right;">$${(totalCommissions / 100).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; font-weight: bold;">Net Revenue</td>
              <td style="padding: 10px; text-align: right; font-weight: bold;">$${((totalRevenue - totalCommissions) / 100).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; font-weight: bold;">Invoices Paid</td>
              <td style="padding: 10px; text-align: right;">${paidInvoices.length}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Open Support Tickets</td>
              <td style="padding: 10px; text-align: right;">${openTickets}</td>
            </tr>
          </table>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This is an automated ${periodLabel.toLowerCase()} report from ${appName}.
            Configure reports in Admin &rarr; Setup &rarr; Security.
          </p>
        </body>
      </html>
    `

    let emailsSent = 0
    try {
      const { sendEmail } = await import('@/lib/email/service')
      for (const email of adminEmails) {
        const result = await sendEmail({
          to: email,
          subject: `${appName} ${periodLabel} Report - ${dateRange}`,
          html: reportHtml,
        })
        if (result.success) emailsSent++
      }
    } catch (emailErr) {
      console.error('Failed to send report emails:', emailErr)
    }

    await admin.from('audit_logs').insert({
      user_id: adminIds[0],
      action: `scheduled_${reportType}_report_sent`,
      resource: 'report',
      details: {
        reportType,
        dateRange,
        totalRevenue,
        totalCommissions,
        newUsers: newUsersInPeriod,
        emailsSent,
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      reportType,
      emailsSent,
      dateRange,
      summary: {
        totalUsers,
        newUsersInPeriod,
        totalRevenue,
        totalCommissions,
        openTickets,
      },
    })
  } catch (err) {
    console.error('Scheduled reports error:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
