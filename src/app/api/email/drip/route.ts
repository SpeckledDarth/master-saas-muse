import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

const WELCOME_SEQUENCE = [
  {
    step: 1,
    key: 'welcome',
    delayHours: 0,
    subject: 'Welcome to PassivePost!',
    html: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6366f1;">Welcome aboard, ${name}!</h1>
        <p>We're thrilled to have you join PassivePost. You're about to transform how you manage your social media.</p>
        <p>Here's what you can do right away:</p>
        <ul>
          <li><strong>Connect your accounts</strong> — Link your social platforms in seconds</li>
          <li><strong>Set your brand voice</strong> — Tell our AI how you sound</li>
          <li><strong>Schedule your first post</strong> — Let the flywheel begin!</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/social/onboarding" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Start Onboarding</a>
        </div>
        <p style="color: #666;">Questions? Just reply to this email.</p>
      </div>
    `,
  },
  {
    step: 2,
    key: 'connect_platforms',
    delayHours: 24,
    subject: 'Connect your first platform',
    html: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hey ${name}, ready to connect?</h2>
        <p>The magic starts when you connect your social accounts. It takes less than 30 seconds per platform.</p>
        <p>Our users typically connect LinkedIn first — it drives the highest engagement for professionals.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/social/onboarding?step=1" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Connect Now</a>
        </div>
      </div>
    `,
  },
  {
    step: 3,
    key: 'first_post',
    delayHours: 72,
    subject: 'Your content flywheel awaits',
    html: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>${name}, create your first post!</h2>
        <p>Did you know? Users who schedule their first post within the first 3 days are 5x more likely to build a consistent posting habit.</p>
        <p>Try our AI post generator — describe your topic and we'll draft it for you.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/social" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Create a Post</a>
        </div>
      </div>
    `,
  },
  {
    step: 4,
    key: 'pro_tips',
    delayHours: 168,
    subject: 'Pro tips to 10x your content',
    html: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Level up your content game, ${name}</h2>
        <p>Here are the features power users love most:</p>
        <ul>
          <li><strong>Blog Repurpose Engine</strong> — Turn one blog post into 7+ social posts</li>
          <li><strong>Content Calendar</strong> — Plan weeks ahead with drag-and-drop</li>
          <li><strong>Best Time to Post</strong> — AI-powered timing recommendations</li>
          <li><strong>Engagement Analytics</strong> — See what resonates with your audience</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/social" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Explore Features</a>
        </div>
      </div>
    `,
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

    let allUsers: { id: string; email?: string; user_metadata?: any; created_at: string }[] = []
    let page = 1
    while (true) {
      const { data } = await adminClient.auth.admin.listUsers({ page, perPage: 100 })
      if (!data?.users || data.users.length === 0) break
      allUsers = allUsers.concat(data.users.map(u => ({
        id: u.id,
        email: u.email,
        user_metadata: u.user_metadata,
        created_at: u.created_at,
      })))
      if (data.users.length < 100) break
      page++
    }

    let sent = 0
    const errors: string[] = []

    for (const user of allUsers) {
      if (!user.email) continue

      const { data: sentEmails } = await adminClient
        .from('email_drip_log')
        .select('step, email_key')
        .eq('user_id', user.id)
        .eq('sequence_name', 'welcome')

      if ((sentEmails || []).length >= WELCOME_SEQUENCE.length) continue

      const sentKeys = new Set((sentEmails || []).map(e => e.email_key))
      const signupTime = new Date(user.created_at).getTime()
      const now = Date.now()
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'there'

      for (const step of WELCOME_SEQUENCE) {
        if (sentKeys.has(step.key)) continue

        const sendAfter = signupTime + step.delayHours * 60 * 60 * 1000
        if (now < sendAfter) continue

        try {
          const result = await sendEmail({
            to: user.email,
            subject: step.subject,
            html: step.html(name),
          })

          if (result.success) {
            await adminClient.from('email_drip_log').insert({
              user_id: user.id,
              sequence_name: 'welcome',
              step: step.step,
              email_key: step.key,
            })
            sent++
          }
        } catch (err) {
          errors.push(`User ${user.id}, step ${step.key}: ${(err as Error).message}`)
        }

        break
      }
    }

    return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined })
  } catch (error) {
    console.error('Email drip error:', error)
    return NextResponse.json({ error: 'Failed to process drip sequence' }, { status: 500 })
  }
}
