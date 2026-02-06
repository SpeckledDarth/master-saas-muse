import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addMetricsAlertJob } from '@/lib/queue'
import { sendEmail } from '@/lib/email/service'

export async function POST() {
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

    const { data: orgSettings } = await adminClient
      .from('organization_settings')
      .select('settings')
      .eq('organization_id', 1)
      .maybeSingle()

    const settings = orgSettings?.settings as any
    const security = settings?.security
    
    if (!security?.alertsEnabled) {
      return NextResponse.json({ message: 'Alerts not enabled', triggered: [] })
    }

    const recipientEmail = security.alertRecipientEmail || user.email
    if (!recipientEmail) {
      return NextResponse.json({ error: 'No recipient email configured' }, { status: 400 })
    }

    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    let activeSubscriptions = 0
    let cancelledThisMonth = 0
    let mrr = 0
    let totalUsers = 0
    let newUsersThisMonth = 0

    try {
      let allUsers: { id: string; created_at: string }[] = []
      let page = 1
      const perPage = 100
      while (true) {
        const { data: authData } = await adminClient.auth.admin.listUsers({ page, perPage })
        if (!authData?.users || authData.users.length === 0) break
        allUsers = allUsers.concat(authData.users.map(u => ({ id: u.id, created_at: u.created_at })))
        if (authData.users.length < perPage) break
        page++
      }
      totalUsers = allUsers.length
      newUsersThisMonth = allUsers.filter(u => u.created_at >= monthAgo).length
    } catch {}

    try {
      const { data: subs } = await adminClient
        .from('subscriptions')
        .select('id, status, price_amount')
        .in('status', ['active', 'trialing'])
      if (subs) {
        activeSubscriptions = subs.length
        mrr = subs.reduce((sum, s) => sum + (s.price_amount || 0), 0)
      }
    } catch {}

    try {
      const { data: cancelled } = await adminClient
        .from('subscriptions')
        .select('id')
        .eq('status', 'canceled')
        .gte('current_period_end', monthAgo)
      if (cancelled) cancelledThisMonth = cancelled.length
    } catch {}

    const churnRate = (activeSubscriptions + cancelledThisMonth) > 0
      ? (cancelledThisMonth / (activeSubscriptions + cancelledThisMonth)) * 100
      : 0

    const triggered: string[] = []

    if (typeof security.alertChurnThreshold === 'number' && churnRate > security.alertChurnThreshold) {
      const jobId = await addMetricsAlertJob({
        alertType: 'churn-threshold',
        threshold: security.alertChurnThreshold,
        currentValue: churnRate,
        recipientEmail,
      })
      if (!jobId) {
        await sendEmail({
          to: recipientEmail,
          subject: 'Alert: Churn Rate Threshold Exceeded',
          html: `<p>Your churn rate has reached ${churnRate.toFixed(1)}%, exceeding your threshold of ${security.alertChurnThreshold}%.</p>`,
        })
      }
      triggered.push('churn-threshold')
    }

    if (typeof security.alertMinMonthlyUsers === 'number' && newUsersThisMonth < security.alertMinMonthlyUsers) {
      const jobId = await addMetricsAlertJob({
        alertType: 'user-growth-stall',
        threshold: security.alertMinMonthlyUsers,
        currentValue: newUsersThisMonth,
        recipientEmail,
      })
      if (!jobId) {
        await sendEmail({
          to: recipientEmail,
          subject: 'Alert: User Growth Below Threshold',
          html: `<p>Only ${newUsersThisMonth} new users this month, below your threshold of ${security.alertMinMonthlyUsers}.</p>`,
        })
      }
      triggered.push('user-growth-stall')
    }

    return NextResponse.json({ success: true, triggered })
  } catch (error) {
    console.error('Metrics alerts error:', error)
    return NextResponse.json({ error: 'Failed to check alerts' }, { status: 500 })
  }
}
