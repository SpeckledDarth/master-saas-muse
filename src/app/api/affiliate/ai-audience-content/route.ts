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
    const audienceDescription = body.audienceDescription || ''
    const contentType = body.contentType || 'social_post'
    const productName = body.productName || 'our product'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const shareUrl = `${baseUrl}/?ref=${link.ref_code}`

    const aiSettings = getDefaultAISettings(1500, 0.8)

    const prompt = `Generate niche-specific promotional content for an affiliate partner promoting "${productName}".

Niche/industry: ${niche || 'not specified'}
Audience description: ${audienceDescription || 'general audience'}
Content type requested: ${contentType}
Referral link: ${shareUrl}
Affiliate ref code: ${link.ref_code}

Rules:
- Tailor the language, examples, and pain points specifically to the described audience/niche
- Use industry-specific terminology and scenarios the audience will relate to
- Show how the product solves problems specific to this niche
- Include the referral link naturally
- Do NOT use any emoji
- Generate content that feels like it was written by someone who deeply understands this audience

Return your response in this exact JSON format:
{
  "content": "The main content piece tailored to the audience",
  "audienceInsights": ["Key insight about this audience that informed the content"],
  "painPoints": ["Pain point 1 addressed", "Pain point 2 addressed"],
  "hooks": ["Alternative hook/opening 1", "Alternative hook/opening 2"],
  "hashtags": ["relevant", "niche", "hashtags"]
}

Return ONLY valid JSON, no markdown code fences, no explanations.`

    const result = await chatCompletion(aiSettings, [{ role: 'user', content: prompt }])

    const parsed = parseJsonResponse(result.content, {
      content: result.content.trim(),
      audienceInsights: [],
      painPoints: [],
      hooks: [],
      hashtags: [],
    })

    return NextResponse.json({
      content: parsed.content || result.content.trim(),
      audienceInsights: Array.isArray(parsed.audienceInsights) ? parsed.audienceInsights : [],
      painPoints: Array.isArray(parsed.painPoints) ? parsed.painPoints : [],
      hooks: Array.isArray(parsed.hooks) ? parsed.hooks : [],
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`) : [],
      shareUrl,
      refCode: link.ref_code,
      niche,
      audienceDescription,
      contentType,
    })
  } catch (error: any) {
    console.error('AI Audience Content error:', error)
    const { error: msg, status } = handleAIError(error)
    return NextResponse.json({ error: msg }, { status })
  }
}
