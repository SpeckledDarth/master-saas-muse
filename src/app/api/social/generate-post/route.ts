import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { defaultSettings } from '@/types/settings'
import { chatCompletion, type ChatMessage } from '@/lib/ai/provider'
import type { AISettings } from '@/types/settings'
import { checkSocialRateLimit, getLimitsForTier } from '@/lib/social/rate-limits'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getSettings() {
  const admin = getSupabaseAdmin()
  const { data } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
  const settings = data?.settings || defaultSettings
  return {
    socialEnabled: settings.features?.socialModuleEnabled ?? false,
    aiEnabled: settings.features?.aiEnabled ?? false,
    aiSettings: { ...defaultSettings.ai!, ...(settings.ai || {}) } as AISettings,
    socialModule: { ...defaultSettings.socialModule!, ...(settings.socialModule || {}) },
  }
}

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
}

function buildSocialPrompt(platform: string, topic: string, brandVoice: string, style: string, includeHashtags: boolean, maxLength: number): string {
  const platformNames: Record<string, string> = {
    twitter: 'Twitter/X',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
  }

  let prompt = `You are a social media content expert. Generate a single ${platformNames[platform] || platform} post about the following topic.\n\n`
  prompt += `Topic: ${topic}\n\n`
  prompt += `Requirements:\n`
  prompt += `- Platform: ${platformNames[platform] || platform}\n`
  prompt += `- Maximum length: ${maxLength} characters\n`
  prompt += `- Style: ${style}\n`

  if (brandVoice) {
    prompt += `- Brand voice: ${brandVoice}\n`
  }

  if (includeHashtags) {
    prompt += `- Include 2-4 relevant hashtags\n`
  } else {
    prompt += `- Do NOT include hashtags\n`
  }

  if (platform === 'twitter') {
    prompt += `- Keep it concise and punchy, within 280 characters\n`
    prompt += `- Optimize for engagement (likes, retweets)\n`
  } else if (platform === 'linkedin') {
    prompt += `- Use a professional tone appropriate for LinkedIn\n`
    prompt += `- Consider adding a hook in the first line\n`
    prompt += `- Use line breaks for readability\n`
  } else if (platform === 'instagram') {
    prompt += `- Write an engaging caption\n`
    prompt += `- Consider using emojis sparingly for visual appeal\n`
  }

  prompt += `\nRespond with ONLY the post content, nothing else. No quotes, no explanations, no prefixes like "Here's your post:".`

  return prompt
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { socialEnabled, aiEnabled, aiSettings, socialModule } = await getSettings()

  if (!socialEnabled) {
    return NextResponse.json({ error: 'Social module is not enabled' }, { status: 403 })
  }

  if (!aiEnabled) {
    return NextResponse.json({ error: 'AI features are not enabled. Enable AI in Features settings to generate posts.' }, { status: 403 })
  }

  const tier = socialModule.tier || 'universal'
  const configuredTierLimits = socialModule.tierLimits
  const limits = getLimitsForTier(tier, configuredTierLimits)
  const rateLimitResult = await checkSocialRateLimit(user.id, 'generate', tier, configuredTierLimits)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: `AI generation limit reached for ${tier} tier (${limits.dailyAiGenerations} per day). Upgrade your tier or try again later.`,
        tier,
        limit: limits.dailyAiGenerations,
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limits.dailyAiGenerations.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  let body: { platform?: string; topic?: string; brandVoice?: string; style?: string; includeHashtags?: boolean; maxLength?: number; imageUrl?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { platform, topic, brandVoice, style, includeHashtags, maxLength, imageUrl } = body

  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
    try {
      const parsed = new URL(imageUrl)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return NextResponse.json({ error: 'Image URL must use http or https protocol' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid image URL format' }, { status: 400 })
    }
  }

  if (!platform || !['twitter', 'linkedin', 'instagram'].includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform. Must be twitter, linkedin, or instagram.' }, { status: 400 })
  }

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
  }

  const effectiveBrandVoice = brandVoice || socialModule.posting?.defaultBrandVoice || ''
  const effectiveStyle = style || 'professional'
  const effectiveIncludeHashtags = includeHashtags !== false
  const effectiveMaxLength = maxLength || PLATFORM_LIMITS[platform] || 280

  const socialPrompt = buildSocialPrompt(
    platform,
    topic.trim(),
    effectiveBrandVoice,
    effectiveStyle,
    effectiveIncludeHashtags,
    effectiveMaxLength
  )

  try {
    let userMessage: ChatMessage
    if (imageUrl && imageUrl.trim()) {
      userMessage = {
        role: 'user',
        content: [
          { type: 'text', text: `Generate a ${platform} post about: ${topic.trim()}` },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      }
    } else {
      userMessage = {
        role: 'user',
        content: `Generate a ${platform} post about: ${topic.trim()}`,
      }
    }

    const result = await chatCompletion(
      { ...aiSettings, systemPrompt: socialPrompt },
      [userMessage]
    )

    const generatedContent = result.content.trim()

    try {
      const admin = getSupabaseAdmin()
      await admin.from('social_posts').insert({
        user_id: user.id,
        platform,
        content: generatedContent,
        status: 'draft',
        ai_generated: true,
        brand_voice: effectiveBrandVoice || null,
      })
    } catch {
    }

    const response: any = {
      content: generatedContent,
      platform,
      characterCount: generatedContent.length,
      maxLength: effectiveMaxLength,
      usage: result.usage,
    }

    if (imageUrl && imageUrl.trim()) {
      response.imageUrl = imageUrl
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Social post generation error:', error)
    return NextResponse.json(
      { error: `Failed to generate post: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
