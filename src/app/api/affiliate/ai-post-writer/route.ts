import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chatCompletion } from '@/lib/ai/provider'
import type { AISettings } from '@/types/settings'

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 2000,
  instagram: 2200,
  email: 5000,
  blog: 5000,
  general: 2000,
}

const PLATFORM_GUIDE: Record<string, string> = {
  twitter: 'Keep it under 280 characters total (including the link). Use 1-2 relevant hashtags. Be punchy and direct.',
  linkedin: 'Professional tone. 2-3 short paragraphs. Include a clear call-to-action. Use 2-3 relevant hashtags.',
  facebook: 'Conversational and relatable. 2-4 sentences. Ask an engaging question. Use 1-2 hashtags.',
  instagram: 'Casual and visual. Add 5-8 relevant hashtags at the end. Mention "link in bio" since Instagram does not support clickable links in captions.',
  email: 'Subject line + body format. Personal and persuasive. 3-4 short paragraphs. No hashtags needed.',
  blog: 'A short promotional paragraph suitable for embedding in a blog post. Natural and informative. 1-2 hashtags optional.',
  general: 'A versatile promotional message that works across platforms. 2-3 sentences. Use 2-3 hashtags.',
}

const TONE_DESCRIPTIONS: Record<string, string> = {
  professional: 'formal, authoritative, data-driven',
  casual: 'friendly, laid-back, conversational',
  enthusiastic: 'excited, energetic, high-energy',
  storytelling: 'narrative-driven, personal anecdote, relatable experience',
  urgent: 'time-sensitive, fear-of-missing-out, limited availability',
}

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

    if (!link) {
      return NextResponse.json({ error: 'No active affiliate link found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const platform = body.platform || 'twitter'
    const tone = body.tone || 'professional'
    const focusTopic = body.focusTopic || ''
    const productName = body.productName || 'our product'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const shareUrl = `${baseUrl}/?ref=${link.ref_code}`

    const platformInstructions = PLATFORM_GUIDE[platform] || PLATFORM_GUIDE.general
    const toneDescription = TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS.professional
    const charLimit = PLATFORM_LIMITS[platform] || 2000

    const focusSection = focusTopic.trim()
      ? `\nFocus/Topic: The post should specifically highlight or discuss: ${focusTopic.trim()}`
      : ''

    const aiSettings: AISettings = {
      provider: 'xai',
      model: 'grok-3-mini-fast',
      maxTokens: 800,
      temperature: 0.8,
      systemPrompt: '',
    }

    const xaiKey = process.env.XAI_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY
    if (!xaiKey && openaiKey) {
      aiSettings.provider = 'openai'
      aiSettings.model = 'gpt-4o-mini'
    }

    const prompt = `Generate a promotional social media post for an affiliate partner promoting "${productName}".

Platform: ${platform}
Tone: ${toneDescription}
Character limit: ${charLimit}
Referral link: ${shareUrl}
Affiliate ref code: ${link.ref_code}
${focusSection}

Platform guidelines: ${platformInstructions}

Important rules:
- The referral link MUST appear in the post exactly as provided: ${shareUrl}
- If the platform is Instagram, mention "link in bio" instead of placing the URL inline, but still reference the ref code
- Do NOT use any emoji
- Sound authentic and genuinely ${tone}, not salesy or spammy
- Focus on the value the product provides
- Include a clear call-to-action
- Stay within the ${charLimit} character limit for the post body

Return your response in this exact JSON format:
{
  "post": "The full post text here",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "characterCount": 123
}

Return ONLY valid JSON, no markdown code fences, no explanations.`

    const result = await chatCompletion(aiSettings, [
      { role: 'user', content: prompt }
    ])

    let parsed: { post: string; hashtags: string[]; characterCount: number }
    try {
      const cleaned = result.content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = {
        post: result.content.trim(),
        hashtags: [],
        characterCount: result.content.trim().length,
      }
    }

    if (!parsed.hashtags || !Array.isArray(parsed.hashtags)) {
      parsed.hashtags = []
    }
    parsed.hashtags = parsed.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`)
    parsed.characterCount = parsed.post.length

    return NextResponse.json({
      post: parsed.post,
      hashtags: parsed.hashtags,
      characterCount: parsed.characterCount,
      platform,
      tone,
      shareUrl,
      refCode: link.ref_code,
    })
  } catch (error: any) {
    console.error('AI Post Writer error:', error)

    if (error.message?.includes('not configured') || error.message?.includes('environment variable')) {
      return NextResponse.json(
        { error: 'AI provider is not configured. Please contact the admin to set up an AI API key.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate post. Please try again.' },
      { status: 500 }
    )
  }
}
