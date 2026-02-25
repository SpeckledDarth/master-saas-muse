import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chatCompletion } from '@/lib/ai/provider'
import { getDefaultAISettings, parseJsonResponse, handleAIError } from '@/lib/ai/affiliate-helpers'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: link } = await admin
      .from('referral_links')
      .select('ref_code, is_affiliate, clicks, signups, total_earnings_cents, created_at')
      .eq('user_id', user.id)
      .eq('is_affiliate', true)
      .maybeSingle()

    if (!link) return NextResponse.json({ error: 'No active affiliate link found' }, { status: 404 })

    const [referralsRes, commissionsRes] = await Promise.all([
      admin.from('affiliate_referrals').select('id').eq('affiliate_user_id', user.id),
      admin.from('affiliate_commissions').select('id').eq('affiliate_user_id', user.id),
    ])

    const totalReferrals = referralsRes.data?.length || 0
    const totalCommissions = commissionsRes.data?.length || 0
    const daysActive = Math.max(1, Math.ceil((Date.now() - new Date(link.created_at).getTime()) / (1000 * 60 * 60 * 24)))

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const shareUrl = `${baseUrl}/?ref=${link.ref_code}`

    const aiSettings = getDefaultAISettings(1500, 0.7)

    const prompt = `You are a friendly onboarding advisor for a new affiliate partner promoting a SaaS product.

Affiliate status:
- Days active: ${daysActive}
- Total clicks on referral link: ${link.clicks || 0}
- Total signups from referrals: ${link.signups || 0}
- Total referrals tracked: ${totalReferrals}
- Total commissions earned: ${totalCommissions}
- Total earnings: $${((link.total_earnings_cents || 0) / 100).toFixed(2)}
- Referral link: ${shareUrl}

Rules:
- Generate a personalized first-week action plan based on their current progress
- If they have no clicks/referrals yet, focus on getting started
- If they have some activity, build on their momentum
- Include 5-7 specific daily tasks for the first week
- Add tips for each task
- Do NOT use any emoji
- Be encouraging but practical

Return your response in this exact JSON format:
{
  "greeting": "Personalized welcome/status message",
  "currentPhase": "getting_started|building_momentum|scaling_up",
  "weekPlan": [
    { "day": 1, "task": "Task description", "tip": "Helpful tip", "priority": "high|medium|low" }
  ],
  "quickWins": ["Quick win 1 they can do right now"],
  "resources": [
    { "title": "Resource title", "description": "What it helps with", "action": "What to do" }
  ]
}

Return ONLY valid JSON, no markdown code fences, no explanations.`

    const result = await chatCompletion(aiSettings, [{ role: 'user', content: prompt }])

    const parsed = parseJsonResponse(result.content, {
      greeting: 'Welcome to the affiliate program!',
      currentPhase: 'getting_started',
      weekPlan: [],
      quickWins: [],
      resources: [],
    })

    return NextResponse.json({
      greeting: parsed.greeting || 'Welcome!',
      currentPhase: parsed.currentPhase || 'getting_started',
      weekPlan: Array.isArray(parsed.weekPlan) ? parsed.weekPlan : [],
      quickWins: Array.isArray(parsed.quickWins) ? parsed.quickWins : [],
      resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      stats: {
        daysActive,
        clicks: link.clicks || 0,
        signups: link.signups || 0,
        referrals: totalReferrals,
        earnings: ((link.total_earnings_cents || 0) / 100).toFixed(2),
      },
      shareUrl,
      refCode: link.ref_code,
    })
  } catch (error: any) {
    console.error('AI Onboarding Advisor error:', error)
    const { error: msg, status } = handleAIError(error)
    return NextResponse.json({ error: msg }, { status })
  }
}
