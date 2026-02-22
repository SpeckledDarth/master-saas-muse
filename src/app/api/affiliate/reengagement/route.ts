import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

const REENGAGEMENT_EMAILS = [
  {
    step: 1, key: 'miss_you',
    subject: 'We miss you!',
    html: (name: string) => `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Hey ${name}, we miss you!</h2>
      <p>It's been a while since you shared your affiliate link. Your audience is still out there — and every share counts.</p>
      <p>Here's a quick reminder of what you earn:</p>
      <ul><li>Commission on every referred payment</li><li>Milestone bonuses as you grow</li><li>Tier upgrades that increase your rate</li></ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/affiliate/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Go to Dashboard</a>
      </div>
    </div>`
  },
  {
    step: 2, key: 'quick_tips',
    subject: 'Quick tips to get your first referral',
    html: (name: string) => `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>${name}, here are 3 easy ways to earn:</h2>
      <ol><li><strong>Share on social media</strong> — a single post can reach hundreds</li><li><strong>Add to your email signature</strong> — passive daily impressions</li><li><strong>Write a quick review</strong> — authentic content converts best</li></ol>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/affiliate/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Get Your Link</a>
      </div>
    </div>`
  },
  {
    step: 3, key: 'new_features',
    subject: 'New features you can promote',
    html: (name: string) => `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>${name}, exciting updates to share!</h2>
      <p>We've been busy building features your audience will love. Here's what's new:</p>
      <ul><li>Improved content scheduling</li><li>New analytics dashboard</li><li>More platform integrations</li></ul>
      <p>These updates give you fresh talking points for your audience. Share the news and earn commissions on new signups!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/affiliate/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Share Now</a>
      </div>
    </div>`
  },
]

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: settings, error: settingsErr } = await adminClient
      .from('affiliate_program_settings')
      .select('reengagement_enabled, dormancy_threshold_days, max_reengagement_emails')
      .maybeSingle()

    if (settingsErr && settingsErr.code === '42P01') {
      return NextResponse.json({ skipped: true, reason: 'settings table not created yet' })
    }

    const reengagementEnabled = settings?.reengagement_enabled ?? false
    const dormancyThresholdDays = settings?.dormancy_threshold_days ?? 30
    const maxReengagementEmails = settings?.max_reengagement_emails ?? 3

    if (!reengagementEnabled) {
      return NextResponse.json({ skipped: true, reason: 'disabled' })
    }

    const { data: affiliates, error: affErr } = await adminClient
      .from('referral_links')
      .select('user_id, referral_code')
      .eq('is_affiliate', true)

    if (affErr) {
      if (affErr.code === '42P01') return NextResponse.json({ skipped: true, reason: 'referral_links table not created yet' })
      return NextResponse.json({ error: affErr.message }, { status: 500 })
    }

    if (!affiliates || affiliates.length === 0) {
      return NextResponse.json({ sent: 0, skipped_already_sent: 0 })
    }

    const now = Date.now()
    const dormancyCutoff = new Date(now - dormancyThresholdDays * 24 * 60 * 60 * 1000).toISOString()
    let sent = 0
    let skippedAlreadySent = 0
    const errors: string[] = []

    for (const affiliate of affiliates) {
      try {
        const { data: recentClick, error: clickErr } = await adminClient
          .from('referral_clicks')
          .select('clicked_at')
          .eq('referral_code', affiliate.referral_code)
          .order('clicked_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (clickErr && clickErr.code === '42P01') continue

        if (recentClick && recentClick.clicked_at > dormancyCutoff) {
          continue
        }

        const { data: sentEmails, error: logErr } = await adminClient
          .from('email_drip_log')
          .select('step, email_key')
          .eq('user_id', affiliate.user_id)
          .eq('sequence_name', 'reengagement')

        if (logErr && logErr.code === '42P01') continue

        const sentCount = (sentEmails || []).length

        if (sentCount >= maxReengagementEmails) {
          skippedAlreadySent++
          continue
        }

        const sentKeys = new Set((sentEmails || []).map(e => e.email_key))

        const nextEmail = REENGAGEMENT_EMAILS.find(e => !sentKeys.has(e.key))
        if (!nextEmail) {
          skippedAlreadySent++
          continue
        }

        const { data: userData } = await adminClient.auth.admin.getUserById(affiliate.user_id)
        const user = userData?.user
        if (!user?.email) continue

        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'there'

        const result = await sendEmail({
          to: user.email,
          subject: nextEmail.subject,
          html: nextEmail.html(name),
        })

        if (result.success) {
          await adminClient.from('email_drip_log').insert({
            user_id: affiliate.user_id,
            sequence_name: 'reengagement',
            step: nextEmail.step,
            email_key: nextEmail.key,
          })
          sent++
        }
      } catch (err) {
        errors.push(`Affiliate ${affiliate.user_id}: ${(err as Error).message}`)
      }
    }

    return NextResponse.json({
      sent,
      skipped_already_sent: skippedAlreadySent,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ skipped: true, reason: 'required tables not created yet' })
    }
    console.error('Reengagement cron error:', error)
    return NextResponse.json({ error: 'Failed to process reengagement' }, { status: 500 })
  }
}
