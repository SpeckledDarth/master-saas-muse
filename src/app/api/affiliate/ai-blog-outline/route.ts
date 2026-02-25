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
    const topic = body.topic || ''
    const audience = body.audience || 'general readers'
    const style = body.style || 'how-to'
    const productName = body.productName || 'our product'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const shareUrl = `${baseUrl}/?ref=${link.ref_code}`

    const aiSettings = getDefaultAISettings(1500, 0.8)

    const prompt = `Generate a blog post outline for an affiliate partner promoting "${productName}".

Topic/angle: ${topic || 'a review or recommendation of the product'}
Target audience: ${audience}
Blog style: ${style}
Referral link: ${shareUrl}
Affiliate ref code: ${link.ref_code}

Rules:
- Create a compelling blog post title
- Write a meta description (150-160 chars)
- Generate 5-8 section headings with 2-3 key points each
- Include a dedicated section for the product recommendation with the referral link
- Add a strong conclusion with a call-to-action featuring the referral link
- Suggest 3-5 SEO keywords
- Do NOT use any emoji

Return your response in this exact JSON format:
{
  "title": "Blog post title",
  "metaDescription": "SEO meta description",
  "sections": [
    { "heading": "Section heading", "keyPoints": ["point 1", "point 2"] }
  ],
  "ctaText": "Call-to-action paragraph with referral link",
  "keywords": ["keyword1", "keyword2"]
}

Return ONLY valid JSON, no markdown code fences, no explanations.`

    const result = await chatCompletion(aiSettings, [{ role: 'user', content: prompt }])

    const parsed = parseJsonResponse(result.content, {
      title: 'Blog Post',
      metaDescription: '',
      sections: [],
      ctaText: '',
      keywords: [],
    })

    return NextResponse.json({
      title: parsed.title || 'Blog Post',
      metaDescription: parsed.metaDescription || '',
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      ctaText: parsed.ctaText || '',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      shareUrl,
      refCode: link.ref_code,
      topic,
      audience,
      style,
    })
  } catch (error: any) {
    console.error('AI Blog Outline error:', error)
    const { error: msg, status } = handleAIError(error)
    return NextResponse.json({ error: msg }, { status })
  }
}
