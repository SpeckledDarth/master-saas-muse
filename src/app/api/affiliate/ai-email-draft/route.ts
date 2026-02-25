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
    const purpose = body.purpose || 'cold outreach'
    const audience = body.audience || 'general'
    const tone = body.tone || 'professional'
    const productName = body.productName || 'our product'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const shareUrl = `${baseUrl}/?ref=${link.ref_code}`

    const aiSettings = getDefaultAISettings(1200, 0.8)

    const prompt = `Generate a complete promotional email for an affiliate partner promoting "${productName}".

Purpose: ${purpose}
Target audience: ${audience}
Tone: ${tone}
Referral link: ${shareUrl}
Affiliate ref code: ${link.ref_code}

Rules:
- Include a compelling subject line
- Write 3-4 short paragraphs
- Include the referral link naturally in the body
- Include a clear call-to-action
- Do NOT use any emoji
- Sound authentic and ${tone}, not spammy
- Make it easy to personalize (use [Name] placeholder for recipient)

Return your response in this exact JSON format:
{
  "subject": "Email subject line here",
  "body": "Full email body here with paragraphs separated by double newlines",
  "previewText": "Short preview text for email clients (50-90 chars)"
}

Return ONLY valid JSON, no markdown code fences, no explanations.`

    const result = await chatCompletion(aiSettings, [{ role: 'user', content: prompt }])

    const parsed = parseJsonResponse(result.content, {
      subject: 'Check this out!',
      body: result.content.trim(),
      previewText: '',
    })

    return NextResponse.json({
      subject: parsed.subject || 'Check this out!',
      body: parsed.body || result.content.trim(),
      previewText: parsed.previewText || '',
      shareUrl,
      refCode: link.ref_code,
      purpose,
      audience,
      tone,
    })
  } catch (error: any) {
    console.error('AI Email Draft error:', error)
    const { error: msg, status } = handleAIError(error)
    return NextResponse.json({ error: msg }, { status })
  }
}
