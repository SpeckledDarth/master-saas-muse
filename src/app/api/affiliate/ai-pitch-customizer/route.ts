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
    const prospectInfo = body.prospectInfo || ''
    const prospectUrl = body.prospectUrl || ''
    const relationship = body.relationship || 'cold'
    const productName = body.productName || 'our product'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const shareUrl = `${baseUrl}/?ref=${link.ref_code}`

    const aiSettings = getDefaultAISettings(1200, 0.8)

    const prompt = `Generate a personalized pitch for an affiliate partner to send to a specific prospect about "${productName}".

Prospect info: ${prospectInfo || 'No details provided'}
Prospect website/URL: ${prospectUrl || 'Not provided'}
Relationship: ${relationship}
Referral link: ${shareUrl}
Affiliate ref code: ${link.ref_code}

Rules:
- Create a highly personalized pitch based on the prospect information
- If a URL is provided, reference specific aspects of their business/content
- Adjust formality based on the relationship (cold = more formal, warm = casual)
- Include the referral link naturally
- Do NOT use any emoji
- Focus on how the product specifically helps THIS prospect
- Include a soft call-to-action appropriate for the relationship level

Return your response in this exact JSON format:
{
  "pitch": "The complete personalized pitch message",
  "subjectLine": "Subject line if sent as email",
  "keyPersonalization": ["Personalization point 1", "Personalization point 2"],
  "followUpSuggestion": "Suggested follow-up message if no response"
}

Return ONLY valid JSON, no markdown code fences, no explanations.`

    const result = await chatCompletion(aiSettings, [{ role: 'user', content: prompt }])

    const parsed = parseJsonResponse(result.content, {
      pitch: result.content.trim(),
      subjectLine: '',
      keyPersonalization: [],
      followUpSuggestion: '',
    })

    return NextResponse.json({
      pitch: parsed.pitch || result.content.trim(),
      subjectLine: parsed.subjectLine || '',
      keyPersonalization: Array.isArray(parsed.keyPersonalization) ? parsed.keyPersonalization : [],
      followUpSuggestion: parsed.followUpSuggestion || '',
      shareUrl,
      refCode: link.ref_code,
      relationship,
    })
  } catch (error: any) {
    console.error('AI Pitch Customizer error:', error)
    const { error: msg, status } = handleAIError(error)
    return NextResponse.json({ error: msg }, { status })
  }
}
