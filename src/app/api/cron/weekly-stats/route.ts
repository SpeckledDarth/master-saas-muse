import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const { data: affiliates } = await admin
      .from('referral_links')
      .select('user_id, ref_code, signups, clicks, total_earnings_cents')
      .eq('is_affiliate', true)

    if (!affiliates || affiliates.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    let sent = 0
    const errors: string[] = []

    for (const affiliate of affiliates) {
      try {
        const [referralsRes, commissionsRes] = await Promise.all([
          admin
            .from('affiliate_referrals')
            .select('id, status')
            .eq('affiliate_user_id', affiliate.user_id)
            .gte('created_at', weekAgo.toISOString()),
          admin
            .from('affiliate_commissions')
            .select('commission_amount_cents, status')
            .eq('affiliate_user_id', affiliate.user_id)
            .gte('created_at', weekAgo.toISOString()),
        ])

        const weekReferrals = referralsRes.data?.length || 0
        const weekConversions = referralsRes.data?.filter((r: any) => r.status === 'converted').length || 0
        const weekEarnings = commissionsRes.data?.reduce((s: number, c: any) => s + c.commission_amount_cents, 0) || 0
        const weekApproved = commissionsRes.data?.filter((c: any) => c.status === 'approved').reduce((s: number, c: any) => s + c.commission_amount_cents, 0) || 0

        const { data: userData } = await admin.auth.admin.getUserById(affiliate.user_id)
        if (!userData?.user?.email) continue

        const name = userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'there'
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

        const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Your Weekly Performance Snapshot</h2>
          <p>Hey ${name}, here's how you did this past week:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; font-weight: 600;">New Referrals</td>
              <td style="padding: 12px; text-align: right; font-size: 18px; font-weight: 700;">${weekReferrals}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; font-weight: 600;">Conversions</td>
              <td style="padding: 12px; text-align: right; font-size: 18px; font-weight: 700;">${weekConversions}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; font-weight: 600;">Earnings This Week</td>
              <td style="padding: 12px; text-align: right; font-size: 18px; font-weight: 700; color: #16a34a;">$${(weekEarnings / 100).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; font-weight: 600;">Approved This Week</td>
              <td style="padding: 12px; text-align: right; font-size: 18px; font-weight: 700;">$${(weekApproved / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: 600;">Total Earnings (All Time)</td>
              <td style="padding: 12px; text-align: right; font-size: 18px; font-weight: 700;">$${(affiliate.total_earnings_cents / 100).toFixed(2)}</td>
            </tr>
          </table>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/affiliate/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Full Dashboard</a>
          </div>
          <p style="color: #6b7280; font-size: 12px;">You're receiving this because you're an affiliate partner. You can manage email preferences in your dashboard settings.</p>
        </div>`

        await sendEmail({
          to: userData.user.email,
          subject: `Your Weekly Report: ${weekReferrals} referrals, $${(weekEarnings / 100).toFixed(2)} earned`,
          html,
        })
        sent++
      } catch (err) {
        errors.push(`Affiliate ${affiliate.user_id}: ${(err as Error).message}`)
      }
    }

    return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined })
  } catch (error: any) {
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ skipped: true, reason: 'tables not created yet' })
    }
    console.error('Weekly stats cron error:', error)
    return NextResponse.json({ error: 'Failed to send weekly stats' }, { status: 500 })
  }
}
