import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chatCompletion } from '@/lib/ai/provider'
import { getDefaultAISettings, parseJsonResponse, handleAIError } from '@/lib/ai/affiliate-helpers'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: link } = await admin
      .from('referral_links')
      .select('ref_code, is_affiliate, clicks, signups, total_earnings_cents')
      .eq('user_id', user.id)
      .eq('is_affiliate', true)
      .maybeSingle()

    if (!link) return NextResponse.json({ error: 'No active affiliate link found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const scenario = body.scenario || ''
    const productName = body.productName || 'our product'

    const conversionRate = link.clicks > 0 ? ((link.signups || 0) / link.clicks * 100).toFixed(1) : '0'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const shareUrl = `${baseUrl}/?ref=${link.ref_code}`

    const aiSettings = getDefaultAISettings(1200, 0.7)

    const prompt = `Generate follow-up talking points and conversion optimization tips for an affiliate promoting "${productName}".

Current stats:
- Total clicks: ${link.clicks || 0}
- Total signups: ${link.signups || 0}
- Conversion rate: ${conversionRate}%
- Total earnings: $${((link.total_earnings_cents || 0) / 100).toFixed(2)}

Scenario/context: ${scenario || 'General conversion optimization'}
Referral link: ${shareUrl}

Rules:
- Analyze the current conversion rate and provide specific improvement suggestions
- Generate follow-up message templates for prospects who clicked but did not convert
- Provide A/B testing suggestions for referral link placement
- Include specific talking points for overcoming hesitation
- Do NOT use any emoji
- Be data-driven and actionable

Return your response in this exact JSON format:
{
  "analysis": "Brief analysis of current conversion performance",
  "followUpTemplates": [
    { "scenario": "When they visited but didn't sign up", "message": "Follow-up message" }
  ],
  "optimizationTips": [
    { "area": "Area to optimize", "suggestion": "Specific suggestion", "expectedImpact": "Expected improvement" }
  ],
  "talkingPoints": ["Talking point 1 for non-converters"],
  "abTestIdeas": ["A/B test idea 1"]
}

Return ONLY valid JSON, no markdown code fences, no explanations.`

    const result = await chatCompletion(aiSettings, [{ role: 'user', content: prompt }])

    const parsed = parseJsonResponse(result.content, {
      analysis: '',
      followUpTemplates: [],
      optimizationTips: [],
      talkingPoints: [],
      abTestIdeas: [],
    })

    return NextResponse.json({
      analysis: parsed.analysis || '',
      followUpTemplates: Array.isArray(parsed.followUpTemplates) ? parsed.followUpTemplates : [],
      optimizationTips: Array.isArray(parsed.optimizationTips) ? parsed.optimizationTips : [],
      talkingPoints: Array.isArray(parsed.talkingPoints) ? parsed.talkingPoints : [],
      abTestIdeas: Array.isArray(parsed.abTestIdeas) ? parsed.abTestIdeas : [],
      currentStats: {
        clicks: link.clicks || 0,
        signups: link.signups || 0,
        conversionRate,
        earnings: ((link.total_earnings_cents || 0) / 100).toFixed(2),
      },
      shareUrl,
      refCode: link.ref_code,
    })
  } catch (error: any) {
    console.error('AI Conversion Optimizer error:', error)
    const { error: msg, status } = handleAIError(error)
    return NextResponse.json({ error: msg }, { status })
  }
}
