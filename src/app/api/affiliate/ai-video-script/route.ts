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
    const videoType = body.videoType || 'review'
    const duration = body.duration || '5-7 minutes'
    const platform = body.platform || 'youtube'
    const productName = body.productName || 'our product'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const shareUrl = `${baseUrl}/?ref=${link.ref_code}`

    const aiSettings = getDefaultAISettings(1500, 0.8)

    const prompt = `Generate a video script for an affiliate partner promoting "${productName}".

Video type: ${videoType}
Target duration: ${duration}
Platform: ${platform}
Referral link: ${shareUrl}
Affiliate ref code: ${link.ref_code}

Rules:
- Write a strong hook for the first 5-10 seconds to grab attention
- Structure the script with clear sections: Hook, Introduction, Main Content, CTA, Outro
- Include natural mentions of the product with the referral link/code
- Add verbal CTA mentioning the referral link (in description / pinned comment)
- Include suggested B-roll or visual notes in brackets
- Suggest a compelling video title and thumbnail concept
- Do NOT use any emoji

Return your response in this exact JSON format:
{
  "title": "Video title",
  "thumbnailConcept": "Brief thumbnail description",
  "hook": "Opening hook text (first 10 seconds)",
  "sections": [
    { "name": "Section name", "script": "Script text", "visualNotes": "Visual suggestions" }
  ],
  "cta": "Call-to-action script mentioning the referral link",
  "estimatedDuration": "Estimated duration"
}

Return ONLY valid JSON, no markdown code fences, no explanations.`

    const result = await chatCompletion(aiSettings, [{ role: 'user', content: prompt }])

    const parsed = parseJsonResponse(result.content, {
      title: 'Video Script',
      thumbnailConcept: '',
      hook: '',
      sections: [],
      cta: '',
      estimatedDuration: duration,
    })

    return NextResponse.json({
      title: parsed.title || 'Video Script',
      thumbnailConcept: parsed.thumbnailConcept || '',
      hook: parsed.hook || '',
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      cta: parsed.cta || '',
      estimatedDuration: parsed.estimatedDuration || duration,
      shareUrl,
      refCode: link.ref_code,
      videoType,
      platform,
    })
  } catch (error: any) {
    console.error('AI Video Script error:', error)
    const { error: msg, status } = handleAIError(error)
    return NextResponse.json({ error: msg }, { status })
  }
}
