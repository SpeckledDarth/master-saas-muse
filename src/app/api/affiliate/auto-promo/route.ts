import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chatCompletion } from '@/lib/ai/provider'
import type { AISettings } from '@/types/settings'

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
    const productName = body.productName || 'our product'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const shareUrl = `${baseUrl}/?ref=${link.ref_code}`

    const platformGuide: Record<string, string> = {
      twitter: 'Keep it under 280 characters. Use 1-2 relevant hashtags. Be punchy and direct.',
      linkedin: 'Professional tone. 2-3 short paragraphs. Include a clear call-to-action.',
      facebook: 'Conversational and relatable. 2-4 sentences. Ask an engaging question.',
      instagram: 'Casual and visual. Include emoji sparingly. Add 3-5 hashtags at the end.',
      email: 'Subject line + body format. Personal and persuasive. 3-4 short paragraphs.',
      blog: 'A short promotional paragraph suitable for embedding in a blog post. Natural and informative.',
      general: 'A versatile promotional message that works across platforms. 2-3 sentences.',
    }

    const platformInstructions = platformGuide[platform] || platformGuide.general

    const aiSettings: AISettings = {
      provider: 'xai',
      model: 'grok-3-mini-fast',
      maxTokens: 512,
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
Tone: ${tone}
Referral link (MUST be included in the post): ${shareUrl}

${platformInstructions}

Important rules:
- The referral link MUST appear in the post exactly as provided
- Do NOT use any emoji
- Sound authentic and genuinely enthusiastic, not salesy or spammy
- Focus on the value the product provides
- Include a clear call-to-action
- Return ONLY the post text, no explanations or alternatives`

    const result = await chatCompletion(aiSettings, [
      { role: 'user', content: prompt }
    ])

    return NextResponse.json({
      content: result.content.trim(),
      platform,
      tone,
      shareUrl,
    })
  } catch (error: any) {
    console.error('Auto-promo generation error:', error)

    if (error.message?.includes('not configured') || error.message?.includes('environment variable')) {
      return NextResponse.json(
        { error: 'AI provider is not configured. Please contact the admin to set up an AI API key.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate promo post. Please try again.' },
      { status: 500 }
    )
  }
}
