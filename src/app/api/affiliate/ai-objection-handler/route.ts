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
    const objection = body.objection || ''
    const context = body.context || ''
    const productName = body.productName || 'our product'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const shareUrl = `${baseUrl}/?ref=${link.ref_code}`

    const aiSettings = getDefaultAISettings(1024, 0.7)

    const prompt = `Generate responses to counter a prospect's objection about "${productName}".

Objection: "${objection || 'It is too expensive'}"
Context: ${context || 'General sales conversation'}
Referral link: ${shareUrl}

Rules:
- Provide 3 different response approaches: empathetic, logical, and social-proof based
- Each response should acknowledge the objection first, then counter it
- Use real pricing/value arguments where possible
- Keep responses concise and conversational (2-3 sentences each)
- Do NOT use any emoji
- Include a gentle redirect to trying the product with the referral link

Return your response in this exact JSON format:
{
  "responses": [
    { "approach": "Empathetic", "response": "Response text" },
    { "approach": "Logical", "response": "Response text" },
    { "approach": "Social Proof", "response": "Response text" }
  ],
  "tips": ["Tip for handling this type of objection"],
  "alternativeFraming": "A different way to frame the product value"
}

Return ONLY valid JSON, no markdown code fences, no explanations.`

    const result = await chatCompletion(aiSettings, [{ role: 'user', content: prompt }])

    const parsed = parseJsonResponse(result.content, {
      responses: [],
      tips: [],
      alternativeFraming: '',
    })

    return NextResponse.json({
      responses: Array.isArray(parsed.responses) ? parsed.responses : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      alternativeFraming: parsed.alternativeFraming || '',
      shareUrl,
      refCode: link.ref_code,
      objection,
    })
  } catch (error: any) {
    console.error('AI Objection Handler error:', error)
    const { error: msg, status } = handleAIError(error)
    return NextResponse.json({ error: msg }, { status })
  }
}
