import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { sendTrendAlertEmail } from '@/lib/social/trend-alerts'
import { randomUUID } from 'crypto'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function isTableNotFoundError(error: { code?: string; message?: string }): boolean {
  return error.code === '42P01' || !!error.message?.includes('does not exist')
}

const SAMPLE_TRENDS = [
  {
    title: 'AI Tools for Small Business',
    description: 'Interest in AI-powered tools for small businesses is surging, with a 340% increase in searches this week. Businesses are looking for practical automation tips.',
    content: 'AI is transforming small business operations. Here are 5 practical ways to start automating today without breaking the bank:\n\n1. Customer support chatbots\n2. Social media scheduling\n3. Invoice processing\n4. Email marketing personalization\n5. Inventory predictions',
    platform: 'linkedin',
    hashtags: ['AI', 'SmallBusiness', 'Automation', 'Productivity'],
  },
  {
    title: 'Sustainable Branding Trends',
    description: 'Eco-conscious branding is trending across social media. Consumers are engaging 2x more with brands that showcase sustainability efforts.',
    content: 'Your brand story matters more than ever. Consumers want to know:\n\nWhat you stand for\nHow you source materials\nYour carbon footprint goals\n\nAuthenticity wins over perfection every time.',
    platform: 'twitter',
    hashtags: ['Sustainability', 'Branding', 'EcoFriendly', 'GreenBusiness'],
  },
  {
    title: 'Short-Form Video Engagement Spike',
    description: 'Short-form video content under 60 seconds is seeing record engagement rates across platforms this month, up 45% compared to long-form.',
    content: 'Quick tip for your next reel or short:\n\nHook in the first 2 seconds\nDeliver value by second 15\nEnd with a clear CTA\n\nThe algorithm rewards watch-through rate above all.',
    platform: 'instagram',
    hashtags: ['Reels', 'ShortFormVideo', 'ContentCreator', 'SocialMediaTips'],
  },
]

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { sendEmail?: boolean } = {}
  try {
    body = await request.json()
  } catch {}

  const shouldSendEmail = body.sendEmail !== false
  const sample = SAMPLE_TRENDS[Math.floor(Math.random() * SAMPLE_TRENDS.length)]
  const alertId = randomUUID()

  const alertRecord = {
    id: alertId,
    user_id: user.id,
    trend_title: sample.title,
    trend_description: sample.description,
    suggested_content: sample.content,
    platform: sample.platform,
    hashtags: sample.hashtags,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  let savedAlert = null
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('trend_alerts')
      .insert(alertRecord)
      .select('*')
      .single()

    if (error) {
      if (isTableNotFoundError(error)) {
        savedAlert = alertRecord
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      savedAlert = data
    }
  } catch {
    savedAlert = alertRecord
  }

  let emailResult = null
  if (shouldSendEmail && user.email) {
    try {
      emailResult = await sendTrendAlertEmail({
        userEmail: user.email,
        userName: user.user_metadata?.full_name || user.user_metadata?.name || '',
        trendTitle: sample.title,
        trendDescription: sample.description,
        suggestedPost: {
          content: sample.content,
          platform: sample.platform,
          hashtags: sample.hashtags,
        },
        alertId,
      })
    } catch (err) {
      console.error('Failed to send trend alert email:', err)
      emailResult = { success: false, error: (err as Error).message }
    }
  }

  return NextResponse.json({
    success: true,
    alert: savedAlert,
    emailSent: emailResult?.success ?? false,
    emailError: emailResult && !emailResult.success ? emailResult.error : undefined,
  })
}
