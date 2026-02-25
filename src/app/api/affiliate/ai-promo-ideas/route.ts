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
      .select('ref_code, is_affiliate')
      .eq('user_id', user.id)
      .eq('is_affiliate', true)
      .maybeSingle()

    if (!link) return NextResponse.json({ error: 'No active affiliate link found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const niche = body.niche || ''
    const channels = body.channels || 'social media, blog, email'
    const experience = body.experience || 'beginner'
    const productName = body.productName || 'our product'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const shareUrl = `${baseUrl}/?ref=${link.ref_code}`

    const aiSettings = getDefaultAISettings(1500, 0.8)

    const prompt = `Generate creative promotion ideas for an affiliate partner promoting "${productName}".

Affiliate's niche: ${niche || 'general'}
Available channels: ${channels}
Experience level: ${experience}
Referral link: ${shareUrl}
Affiliate ref code: ${link.ref_code}

Rules:
- Generate 5-7 specific, actionable promotion ideas
- Tailor ideas to the affiliate's niche and experience level
- Each idea should include: title, description, estimated effort, and expected impact
- Mix quick wins with longer-term strategies
- Include specific execution steps for each idea
- Do NOT use any emoji
- Be creative but realistic

Return your response in this exact JSON format:
{
  "ideas": [
    {
      "title": "Idea title",
      "description": "Detailed description of the promotion idea",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "effort": "low|medium|high",
      "impact": "low|medium|high",
      "channel": "Primary channel for this idea",
      "timeframe": "How long to execute"
    }
  ],
  "weeklyPlan": "Suggested weekly schedule incorporating these ideas"
}

Return ONLY valid JSON, no markdown code fences, no explanations.`

    const result = await chatCompletion(aiSettings, [{ role: 'user', content: prompt }])

    const parsed = parseJsonResponse(result.content, {
      ideas: [],
      weeklyPlan: '',
    })

    return NextResponse.json({
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas : [],
      weeklyPlan: parsed.weeklyPlan || '',
      shareUrl,
      refCode: link.ref_code,
      niche,
      channels,
      experience,
    })
  } catch (error: any) {
    console.error('AI Promo Ideas error:', error)
    const { error: msg, status } = handleAIError(error)
    return NextResponse.json({ error: msg }, { status })
  }
}
