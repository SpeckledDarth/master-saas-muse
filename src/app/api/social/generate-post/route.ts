import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { defaultSettings } from '@/types/settings'
import { chatCompletion, type ChatMessage } from '@/lib/ai/provider'
import type { AISettings, NicheGuidanceEntry } from '@/types/settings'
import { checkSocialRateLimit, getLimitsForTier } from '@/lib/social/rate-limits'
import { getUserSocialTier } from '@/lib/social/user-tier'

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
  const socialModule = { ...defaultSettings.socialModule!, ...(settings.socialModule || {}) }
  return {
    socialEnabled: settings.features?.socialModuleEnabled ?? false,
    aiEnabled: settings.features?.aiEnabled ?? false,
    aiSettings: { ...defaultSettings.ai!, ...(settings.ai || {}) } as AISettings,
    socialModule,
    nicheGuidance: (socialModule.nicheGuidance || defaultSettings.socialModule!.nicheGuidance || []) as NicheGuidanceEntry[],
  }
}

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
  youtube: 5000,
  tiktok: 2200,
  reddit: 40000,
  pinterest: 500,
  snapchat: 250,
  discord: 2000,
}

interface BrandPreferences {
  tone: string
  niche: string
  location: string | null
  target_audience: string | null
  posting_goals: string | null
  sample_urls: string[]
}

async function getUserBrandPreferences(userId: string): Promise<BrandPreferences | null> {
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('brand_preferences')
      .select('tone, niche, location, target_audience, posting_goals, sample_urls')
      .eq('user_id', userId)
      .single()
    if (error || !data) return null
    return data as BrandPreferences
  } catch {
    return null
  }
}

function buildSocialPrompt(
  platform: string,
  topic: string,
  brandVoice: string,
  style: string,
  includeHashtags: boolean,
  maxLength: number,
  brandPrefs?: BrandPreferences | null,
  nicheGuidanceEntries?: NicheGuidanceEntry[]
): string {
  const platformNames: Record<string, string> = {
    twitter: 'Twitter/X',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    facebook: 'Facebook',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    reddit: 'Reddit',
    pinterest: 'Pinterest',
    snapchat: 'Snapchat',
    discord: 'Discord',
  }

  const platName = platformNames[platform] || platform
  const tone = brandPrefs?.tone || style || 'professional'
  const niche = brandPrefs?.niche || ''
  const audience = brandPrefs?.target_audience || ''
  const location = brandPrefs?.location || ''
  const goals = brandPrefs?.posting_goals || ''

  let prompt = `You are a social media strategist for a ${niche || 'small business'} professional`
  if (location) {
    prompt += ` based in ${location}`
  }
  prompt += `. Your job is to write posts that drive real business results.\n\n`

  prompt += `TASK: Generate a single ${platName} post about "${topic}"\n\n`

  prompt += `VOICE & STYLE:\n`
  prompt += `- Tone: ${tone}\n`
  if (brandVoice && brandVoice !== tone) {
    prompt += `- Brand voice: ${brandVoice}\n`
  }
  prompt += `- Write like a real person, not a marketing bot\n`
  prompt += `- Be specific and concrete, avoid generic platitudes\n\n`

  const nicheLower = niche.toLowerCase().replace(/[-_\s]+/g, '_')
  const entries = nicheGuidanceEntries || []
  const matchedEntry = entries.find(e => {
    const entryKey = e.key.toLowerCase().replace(/[-_\s]+/g, '_')
    return entryKey === nicheLower || (e.label && e.label.toLowerCase() === niche.toLowerCase())
  })
  const nicheHint = matchedEntry?.guidance || ''
  const DEFAULT_NICHE_FALLBACK = 'Use a casual, local, authentic small business voice. Sound like a real person talking to their neighbors and community — not a corporation.'
  prompt += `NICHE VOICE:\n- ${nicheHint || DEFAULT_NICHE_FALLBACK}\n\n`

  if (niche || audience || goals) {
    prompt += `BUSINESS CONTEXT:\n`
    if (niche) {
      prompt += `- Industry: ${niche}\n`
    }
    if (audience) {
      prompt += `- Target audience: ${audience}\n`
    }
    if (goals) {
      prompt += `- Goal of this post: ${goals}\n`
    }
    if (location) {
      prompt += `- Serving: ${location} area\n`
    }
    prompt += `\n`
  }

  prompt += `PLATFORM RULES:\n`
  prompt += `- Platform: ${platName}\n`
  prompt += `- Maximum: ${maxLength} characters\n`

  if (includeHashtags) {
    prompt += `- Include 2-4 relevant hashtags naturally at the end\n`
  } else {
    prompt += `- Do NOT include any hashtags\n`
  }

  if (platform === 'twitter') {
    prompt += `- Lead with a hook that stops the scroll\n`
    prompt += `- Keep it punchy and under 280 characters\n`
    prompt += `- Optimize for retweets and replies\n`
  } else if (platform === 'linkedin') {
    prompt += `- Start with a strong opening hook (first line matters most)\n`
    prompt += `- Use short paragraphs and line breaks for readability\n`
    prompt += `- End with a question or call-to-action to drive comments\n`
    prompt += `- Professional but authentic, not corporate-speak\n`
  } else if (platform === 'instagram') {
    prompt += `- Write an engaging caption that tells a micro-story\n`
    prompt += `- Front-load the hook before the "more" truncation\n`
  } else if (platform === 'facebook') {
    prompt += `- Write for a Facebook Page audience (customers and community)\n`
    prompt += `- Conversational tone that invites comments and shares\n`
    prompt += `- Include a clear call-to-action (call us, visit, book, etc.)\n`
  } else if (platform === 'reddit') {
    prompt += `- Write genuinely, as a community member sharing knowledge\n`
    prompt += `- Never sound promotional or sales-oriented\n`
    prompt += `- Add real value to the discussion\n`
  }

  prompt += `\nOUTPUT: Respond with ONLY the post text. No quotes, no explanations, no labels, no prefixes.`

  return prompt
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { socialEnabled, aiEnabled, aiSettings, socialModule, nicheGuidance } = await getSettings()

  if (!socialEnabled) {
    return NextResponse.json({ error: 'Social module is not enabled' }, { status: 403 })
  }

  if (!aiEnabled) {
    return NextResponse.json({ error: 'AI features are not enabled. Enable AI in Features settings to generate posts.' }, { status: 403 })
  }

  const adminTier = socialModule.tier || 'starter'
  const configuredTierLimits = socialModule.tierLimits
  const { tier } = await getUserSocialTier(user.id, adminTier)
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

  const validPlatforms = ['twitter', 'linkedin', 'instagram', 'facebook', 'youtube', 'tiktok', 'reddit', 'pinterest', 'snapchat', 'discord']
  if (!platform || !validPlatforms.includes(platform)) {
    return NextResponse.json({ error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` }, { status: 400 })
  }

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
  }

  const brandPrefs = await getUserBrandPreferences(user.id)

  const effectiveBrandVoice = brandVoice || brandPrefs?.tone || socialModule.posting?.defaultBrandVoice || ''
  const effectiveStyle = style || (brandPrefs?.tone ? brandPrefs.tone : 'professional')
  const effectiveIncludeHashtags = includeHashtags !== false
  const effectiveMaxLength = maxLength || PLATFORM_LIMITS[platform] || 280

  const socialPrompt = buildSocialPrompt(
    platform,
    topic.trim(),
    effectiveBrandVoice,
    effectiveStyle,
    effectiveIncludeHashtags,
    effectiveMaxLength,
    brandPrefs,
    nicheGuidance
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
