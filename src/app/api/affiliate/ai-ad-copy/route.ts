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
    const adPlatform = body.platform || 'facebook'
    const objective = body.objective || 'conversions'
    const audience = body.audience || 'general'
    const productName = body.productName || 'our product'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const shareUrl = `${baseUrl}/?ref=${link.ref_code}`

    const aiSettings = getDefaultAISettings(1200, 0.8)

    const prompt = `Generate ad copy variations for an affiliate partner promoting "${productName}".

Ad platform: ${adPlatform}
Campaign objective: ${objective}
Target audience: ${audience}
Referral link: ${shareUrl}
Affiliate ref code: ${link.ref_code}

Rules:
- Generate 3 ad copy variations with different angles
- Each variation needs: headline, primary text (body), and call-to-action text
- For Facebook/Instagram: headline (40 chars max), primary text (125 chars for best results), CTA button text
- For Google: headline (30 chars max), description (90 chars max)
- Include the referral link as the destination URL
- Do NOT use any emoji
- Focus on benefits, not features
- Each variation should use a different persuasion angle (social proof, urgency, value, etc.)

Return your response in this exact JSON format:
{
  "variations": [
    {
      "angle": "Persuasion angle used",
      "headline": "Ad headline",
      "primaryText": "Ad body/description text",
      "ctaText": "CTA button text",
      "destinationUrl": "${shareUrl}"
    }
  ],
  "platform": "${adPlatform}",
  "tips": ["Tip for running this ad effectively"]
}

Return ONLY valid JSON, no markdown code fences, no explanations.`

    const result = await chatCompletion(aiSettings, [{ role: 'user', content: prompt }])

    const parsed = parseJsonResponse(result.content, {
      variations: [],
      platform: adPlatform,
      tips: [],
    })

    return NextResponse.json({
      variations: Array.isArray(parsed.variations) ? parsed.variations : [],
      platform: parsed.platform || adPlatform,
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      shareUrl,
      refCode: link.ref_code,
      objective,
      audience,
    })
  } catch (error: any) {
    console.error('AI Ad Copy error:', error)
    const { error: msg, status } = handleAIError(error)
    return NextResponse.json({ error: msg }, { status })
  }
}
