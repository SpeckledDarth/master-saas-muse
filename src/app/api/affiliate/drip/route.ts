import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const INTERNAL_SECRET = process.env.SESSION_SECRET || ''

const AFFILIATE_SEQUENCE = [
  {
    step: 1,
    key: 'affiliate_welcome',
    delayHours: 0,
    subject: 'Welcome to the Affiliate Program!',
    html: (name: string, refUrl: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6366f1;">You're In, ${name}!</h1>
        <p>Congrats on joining our affiliate program. Here's everything you need to start earning commissions:</p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; font-size: 14px;">Your Referral Link:</p>
          <p style="margin: 8px 0 0; font-family: monospace; word-break: break-all;">${refUrl}</p>
        </div>
        <p>Share this link anywhere — social media, email, blog posts. When someone signs up and subscribes through your link, you earn a commission on every payment they make.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/social/affiliate" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Your Dashboard</a>
        </div>
        <p style="color: #666;">More tips coming tomorrow!</p>
      </div>
    `,
  },
  {
    step: 2,
    key: 'affiliate_tips',
    delayHours: 24,
    subject: 'How top affiliates earn the most',
    html: (name: string, refUrl: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hey ${name}, here are some quick wins:</h2>
        <ol style="line-height: 2;">
          <li><strong>Share your story</strong> — Write a quick post about why you use PassivePost and include your link</li>
          <li><strong>Use our marketing assets</strong> — We've got banners, email templates, and social post templates ready for you</li>
          <li><strong>Pin it everywhere</strong> — Add your link to your social bios, email signature, and website</li>
          <li><strong>Help your referrals succeed</strong> — When they stick around, your commissions keep coming</li>
        </ol>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/social/affiliate" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Check Your Marketing Assets</a>
        </div>
      </div>
    `,
  },
  {
    step: 3,
    key: 'affiliate_strategy',
    delayHours: 72,
    subject: 'Your first-week affiliate strategy',
    html: (name: string, refUrl: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>${name}, here's your Week 1 game plan:</h2>
        <p>The best affiliates don't just drop a link — they tell a story. Here's a proven formula:</p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-weight: bold;">The Story Formula:</p>
          <p style="margin: 0;">1. What problem did you have before? (managing social media was chaos)<br/>
          2. What did you try? (other tools, manual posting)<br/>
          3. What changed? (found PassivePost, everything automated)<br/>
          4. What's the result? (more engagement, less time)<br/>
          5. Your link: <span style="font-family: monospace;">${refUrl}</span></p>
        </div>
        <p>Post this on LinkedIn, Twitter, or your blog. Authentic stories convert 3x better than cold links.</p>
        <p>Keep earning! Remember, you can track every click and conversion in your affiliate dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/social/affiliate" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Your Progress</a>
        </div>
      </div>
    `,
  },
]

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-internal-secret')
    if (!INTERNAL_SECRET || authHeader !== INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: userData } = await admin.auth.admin.getUserById(userId)
    if (!userData?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: link } = await admin
      .from('referral_links')
      .select('ref_code')
      .eq('user_id', userId)
      .maybeSingle()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://passivepost.io'
    const refUrl = link ? `${baseUrl}?ref=${link.ref_code}` : baseUrl

    const name = userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0] || 'there'
    const email = userData.user.email

    if (!email) {
      return NextResponse.json({ error: 'User has no email' }, { status: 400 })
    }

    const { data: existingLogs } = await admin
      .from('email_drip_log')
      .select('step')
      .eq('user_id', userId)
      .eq('sequence_name', 'affiliate')

    const sentSteps = new Set((existingLogs || []).map((l: any) => l.step))

    let sent = 0
    for (const step of AFFILIATE_SEQUENCE) {
      if (sentSteps.has(step.step)) continue

      if (step.delayHours > 0) {
        const { data: firstLog } = await admin
          .from('email_drip_log')
          .select('sent_at')
          .eq('user_id', userId)
          .eq('sequence_name', 'affiliate')
          .eq('step', 1)
          .maybeSingle()

        if (firstLog) {
          const firstSentAt = new Date(firstLog.sent_at)
          const delayMs = step.delayHours * 3600000
          if (Date.now() < firstSentAt.getTime() + delayMs) continue
        } else {
          continue
        }
      }

      try {
        const { sendEmail } = await import('@/lib/email')
        await sendEmail({
          to: email,
          subject: step.subject,
          html: step.html(name, refUrl),
        })

        await admin
          .from('email_drip_log')
          .insert({
            user_id: userId,
            sequence_name: 'affiliate',
            step: step.step,
            email_key: step.key,
          })

        sent++
      } catch (err) {
        console.error(`Failed to send affiliate drip step ${step.step}:`, err)
      }
    }

    return NextResponse.json({ sent, total: AFFILIATE_SEQUENCE.length })
  } catch (err) {
    console.error('Affiliate drip error:', err)
    return NextResponse.json({ error: 'Failed to process affiliate drip' }, { status: 500 })
  }
}
