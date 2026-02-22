import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

const AFFILIATE_SEQUENCE = [
  { step: 1, key: 'welcome', delayHours: 0, subject: 'Welcome to our Affiliate Program!',
    html: (name: string) => `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #6366f1;">Welcome aboard, ${name}!</h1>
      <p>You're now part of our affiliate program. Here's your dashboard where you can track everything.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/affiliate/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Dashboard</a>
      </div>
    </div>` },
  { step: 2, key: 'share_first_link', delayHours: 24, subject: 'Share your first affiliate link',
    html: (name: string) => `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Hey ${name}, let's get your first referral!</h2>
      <p>The easiest way to start earning? Share your unique referral link. Here's how:</p>
      <ol><li>Go to your affiliate dashboard</li><li>Copy your referral link</li><li>Share it on social media, in your newsletter, or with colleagues</li></ol>
      <p><strong>Pro tip:</strong> Use the Deep Link Generator to create links to specific pages like the pricing page — they convert 3x better!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/affiliate/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Get Your Link</a>
      </div>
    </div>` },
  { step: 3, key: 'write_review', delayHours: 48, subject: 'Write your first review — templates inside',
    html: (name: string) => `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>${name}, authentic reviews convert best</h2>
      <p>The highest-earning affiliates write honest reviews. Here's a template to get started:</p>
      <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><em>"I've been using [Product] for [time period] and here's what I love about it: [your favorite feature]. If you're looking for [problem it solves], I highly recommend checking it out. [Your referral link]"</em></p>
      </div>
      <p>Check out the Marketing tab in your dashboard for more swipe copy and templates.</p>
    </div>` },
  { step: 4, key: 'social_promo', delayHours: 72, subject: 'Promote on social media — swipe copy included',
    html: (name: string) => `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>${name}, ready to go social?</h2>
      <p>Social media is where most affiliate conversions happen. Here are the best times to post:</p>
      <ul><li><strong>LinkedIn:</strong> Tuesday-Thursday, 8-10 AM</li><li><strong>Twitter/X:</strong> Weekdays, 12-3 PM</li><li><strong>Facebook:</strong> Wednesday-Friday, 1-4 PM</li></ul>
      <p><strong>Quick post ideas:</strong></p>
      <ul><li>Share a screenshot of a feature you love</li><li>Tell a story about how it saved you time</li><li>Create a before/after comparison</li></ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/affiliate/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Get Swipe Copy</a>
      </div>
    </div>` },
  { step: 5, key: 'check_stats', delayHours: 120, subject: 'Check your stats — here\'s how to read your dashboard',
    html: (name: string) => `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>${name}, let's check your progress!</h2>
      <p>Your affiliate dashboard has everything you need to optimize your performance:</p>
      <ul><li><strong>Link Clicks</strong> — How many people clicked your link</li><li><strong>Signups</strong> — How many became users</li><li><strong>Conversion Rate</strong> — Your click-to-signup percentage</li><li><strong>Earnings</strong> — Your total commissions earned</li></ul>
      <p><strong>Pro tip:</strong> Use source tags (?src=youtube) in your links to see which channels perform best!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/affiliate/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Dashboard</a>
      </div>
    </div>` },
  { step: 6, key: 'first_week_report', delayHours: 168, subject: 'Your first week report',
    html: (name: string) => `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>One week down, ${name}!</h2>
      <p>You've completed your first week as an affiliate. Here's what to focus on next:</p>
      <ul><li>Review which sources drive the most clicks</li><li>Double down on your best-performing channel</li><li>Check the leaderboard to see where you rank</li></ul>
      <p>Remember: consistency beats intensity. Even one share per week compounds over time.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/affiliate/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Check Your Stats</a>
      </div>
    </div>` },
  { step: 7, key: 'level_up', delayHours: 336, subject: 'Level up — advanced affiliate strategies',
    html: (name: string) => `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Ready to level up, ${name}?</h2>
      <p>Top affiliates use these advanced strategies:</p>
      <ol><li><strong>Create dedicated content</strong> — Blog posts, YouTube reviews, or tutorials</li><li><strong>Build an email sequence</strong> — Drip your referral link to your audience</li><li><strong>Target high-intent pages</strong> — Use deep links to the pricing page</li><li><strong>Track everything</strong> — Use source tags and UTM parameters</li></ol>
      <p>The affiliate leaderboard and tier system reward consistent effort. Keep climbing!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/affiliate/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Resources</a>
      </div>
    </div>` },
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

    let affiliates: { user_id: string; locked_at: string }[] = []
    try {
      const { data, error } = await adminClient
        .from('referral_links')
        .select('user_id, locked_at')
        .eq('is_affiliate', true)

      if (error) {
        if (error.code === '42P01') {
          return NextResponse.json({ sent: 0, skipped: 'referral_links table does not exist' })
        }
        throw error
      }
      affiliates = data || []
    } catch (err: any) {
      if (err?.code === '42P01' || err?.message?.includes('42P01')) {
        return NextResponse.json({ sent: 0, skipped: 'referral_links table does not exist' })
      }
      throw err
    }

    let sent = 0
    const errors: string[] = []

    for (const affiliate of affiliates) {
      if (!affiliate.locked_at) continue

      const { data: userData } = await adminClient.auth.admin.getUserById(affiliate.user_id)
      if (!userData?.user?.email) continue

      const email = userData.user.email
      const name = userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || email.split('@')[0] || 'there'

      let sentEmails: { step: number; email_key: string }[] = []
      try {
        const { data, error } = await adminClient
          .from('email_drip_log')
          .select('step, email_key')
          .eq('user_id', affiliate.user_id)
          .eq('sequence_name', 'affiliate')

        if (error) {
          if (error.code === '42P01') {
            return NextResponse.json({ sent: 0, skipped: 'email_drip_log table does not exist' })
          }
          throw error
        }
        sentEmails = data || []
      } catch (err: any) {
        if (err?.code === '42P01' || err?.message?.includes('42P01')) {
          return NextResponse.json({ sent: 0, skipped: 'email_drip_log table does not exist' })
        }
        throw err
      }

      if (sentEmails.length >= AFFILIATE_SEQUENCE.length) continue

      const sentKeys = new Set(sentEmails.map(e => e.email_key))
      const joinTime = new Date(affiliate.locked_at).getTime()
      const now = Date.now()

      for (const step of AFFILIATE_SEQUENCE) {
        if (sentKeys.has(step.key)) continue

        const sendAfter = joinTime + step.delayHours * 60 * 60 * 1000
        if (now < sendAfter) continue

        try {
          const result = await sendEmail({
            to: email,
            subject: step.subject,
            html: step.html(name),
          })

          if (result.success) {
            await adminClient.from('email_drip_log').insert({
              user_id: affiliate.user_id,
              sequence_name: 'affiliate',
              step: step.step,
              email_key: step.key,
            })
            sent++
          }
        } catch (err) {
          errors.push(`User ${affiliate.user_id}, step ${step.key}: ${(err as Error).message}`)
        }

        break
      }
    }

    return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined })
  } catch (error) {
    console.error('Affiliate drip error:', error)
    return NextResponse.json({ error: 'Failed to process affiliate drip sequence' }, { status: 500 })
  }
}
