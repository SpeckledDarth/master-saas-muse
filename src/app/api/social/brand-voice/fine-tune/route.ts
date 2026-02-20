import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { defaultSettings } from '@/types/settings'
import { chatCompletion } from '@/lib/ai/provider'
import type { AISettings } from '@/types/settings'

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
      },
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getAISettings(): Promise<{ enabled: boolean; settings: AISettings }> {
  const admin = getSupabaseAdmin()
  const { data } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
  const settings = (data?.settings || {}) as any
  return { enabled: settings.features?.aiEnabled ?? false, settings: { ...defaultSettings.ai!, ...(settings.ai || {}) } as AISettings }
}

const safeFetch = async (queryFn: () => PromiseLike<{ data: any; error: any }>) => {
  try { const r = await queryFn(); if (r.error?.code === '42P01' || r.error?.message?.includes('does not exist')) return { data: [] }; return { data: r.data || [] } } catch { return { data: [] } }
}

function basicAnalysis(samples: string[]) {
  const allText = samples.join(' ')
  const words = allText.split(/\s+/).filter(w => w.length > 0)
  const avgWordCount = Math.round(words.length / samples.length)

  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
  const emojiMatches = allText.match(emojiRegex) || []
  const emojiCount = emojiMatches.length

  const questionCount = (allText.match(/\?/g) || []).length
  const exclamationCount = (allText.match(/!/g) || []).length

  const wordFreq: Record<string, number> = {}
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their'])
  words.forEach(w => {
    const lower = w.toLowerCase().replace(/[^a-z]/g, '')
    if (lower.length > 2 && !stopWords.has(lower)) {
      wordFreq[lower] = (wordFreq[lower] || 0) + 1
    }
  })
  const commonWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)

  const avgSentenceLength = words.length / Math.max(1, (allText.match(/[.!?]+/g) || []).length)
  let sentenceStyle = 'mixed'
  if (avgSentenceLength < 10) sentenceStyle = 'short and punchy'
  else if (avgSentenceLength > 20) sentenceStyle = 'long and detailed'

  let tone = 'neutral'
  if (exclamationCount > questionCount * 2) tone = 'enthusiastic'
  else if (questionCount > exclamationCount) tone = 'conversational'
  else if (avgWordCount > 50) tone = 'detailed and thorough'
  else tone = 'concise and direct'

  const emojiUsage = emojiCount === 0 ? 'None' : emojiCount < 3 ? 'Minimal' : emojiCount < 10 ? 'Moderate' : 'Heavy'

  const ctaStyle = questionCount > samples.length ? 'Question-based engagement' : exclamationCount > samples.length ? 'Energetic calls to action' : 'Subtle and informational'

  return {
    tone,
    vocabulary: commonWords,
    sentenceStyle,
    emojiUsage,
    ctaStyle,
    uniquePhrases: [] as string[],
    promptTemplate: `Write in a ${tone} tone. Use ${sentenceStyle} sentences. ${emojiUsage === 'None' ? 'Do not use emojis.' : `Use emojis ${emojiUsage.toLowerCase()}.`} Average post length should be around ${avgWordCount} words. Common vocabulary includes: ${commonWords.slice(0, 5).join(', ')}.`,
    summary: `Your writing style is ${tone} with ${sentenceStyle} sentences. You average ${avgWordCount} words per post with ${emojiUsage.toLowerCase()} emoji usage. Your CTA style is ${ctaStyle.toLowerCase()}.`,
  }
}

export async function GET() {
  let user
  try {
    user = await getAuthenticatedUser()
  } catch {
    return NextResponse.json({ error: 'Auth error' }, { status: 401 })
  }
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = getSupabaseAdmin()
    const result = await safeFetch(() =>
      admin.from('brand_preferences').select('voice_profile').eq('user_id', user.id).single()
    )

    const profile = Array.isArray(result.data) ? null : result.data?.voice_profile || null
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Voice profile GET error:', error)
    return NextResponse.json({ profile: null })
  }
}

export async function POST(request: NextRequest) {
  let user
  try {
    user = await getAuthenticatedUser()
  } catch {
    return NextResponse.json({ error: 'Auth error' }, { status: 401 })
  }
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { samplePosts?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { samplePosts } = body
  if (!Array.isArray(samplePosts) || samplePosts.length < 3) {
    return NextResponse.json({ error: 'At least 3 writing samples are required' }, { status: 400 })
  }
  if (samplePosts.length > 15) {
    return NextResponse.json({ error: 'Maximum 15 writing samples allowed' }, { status: 400 })
  }

  const validSamples = samplePosts.filter(s => typeof s === 'string' && s.trim().length > 10)
  if (validSamples.length < 3) {
    return NextResponse.json({ error: 'At least 3 samples with 10+ characters are required' }, { status: 400 })
  }

  try {
    let profile: any

    const aiConfig = await getAISettings()

    if (aiConfig.enabled) {
      try {
        const systemPrompt = `Analyze these writing samples and create a detailed brand voice profile. Identify: (1) Tone characteristics (formal/casual/witty/etc), (2) Common vocabulary patterns, (3) Sentence structure preferences (short/long/mixed), (4) Emoji usage pattern, (5) Call-to-action style, (6) Unique phrases or verbal tics, (7) A reusable prompt template that would make AI write in this exact voice. Return ONLY valid JSON with: { "tone": "string", "vocabulary": ["string"], "sentenceStyle": "string", "emojiUsage": "string", "ctaStyle": "string", "uniquePhrases": ["string"], "promptTemplate": "string", "summary": "string" }`

        const userMessage = `Here are the writing samples to analyze:\n\n${validSamples.map((s, i) => `Sample ${i + 1}:\n${s}`).join('\n\n')}`

        const result = await chatCompletion(aiConfig.settings, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ])

        const content = result.content.trim()
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          profile = JSON.parse(jsonMatch[0])
        } else {
          profile = basicAnalysis(validSamples)
        }
      } catch (aiError) {
        console.error('AI analysis failed, falling back to basic:', aiError)
        profile = basicAnalysis(validSamples)
      }
    } else {
      profile = basicAnalysis(validSamples)
    }

    const admin = getSupabaseAdmin()

    const { data: existing } = await safeFetch(() =>
      admin.from('brand_preferences').select('id').eq('user_id', user.id).single()
    )

    if (existing && !Array.isArray(existing)) {
      await admin
        .from('brand_preferences')
        .update({ voice_profile: profile })
        .eq('user_id', user.id)
    } else {
      await admin
        .from('brand_preferences')
        .insert({ user_id: user.id, voice_profile: profile, tone: 'professional', niche: '' })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Voice fine-tune POST error:', error)
    return NextResponse.json({ error: 'Failed to analyze voice samples' }, { status: 500 })
  }
}
