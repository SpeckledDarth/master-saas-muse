import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { defaultSettings } from '@/types/settings'
import { chatCompletion } from '@/lib/ai/provider'
import type { AISettings } from '@/types/settings'

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

async function getAISettings(): Promise<{ enabled: boolean; settings: AISettings }> {
  const admin = getSupabaseAdmin()
  const { data } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
  const settings = (data?.settings || {}) as any
  return {
    enabled: settings.features?.aiEnabled ?? false,
    settings: { ...defaultSettings.ai!, ...(settings.ai || {}) } as AISettings,
  }
}

const PROMOTIONAL_KEYWORDS = ['buy', 'sale', 'discount', 'offer', 'promo', 'deal', 'price', 'shop', 'order', 'launch', 'product', 'available', 'checkout', 'limited', 'exclusive']
const EDUCATIONAL_KEYWORDS = ['learn', 'how', 'guide', 'tutorial', 'tips', 'steps', 'explain', 'understand', 'strategy', 'framework', 'method', 'lesson', 'course', 'knowledge', 'insight']
const ENTERTAINING_KEYWORDS = ['funny', 'meme', 'laugh', 'joke', 'fun', 'hilarious', 'lol', 'haha', 'relatable', 'mood', 'vibe', 'story', 'wild', 'crazy', 'behind the scenes']
const INSPIRATIONAL_KEYWORDS = ['inspire', 'motivate', 'dream', 'believe', 'success', 'growth', 'journey', 'mindset', 'grateful', 'transform', 'achieve', 'overcome', 'purpose', 'vision', 'impact']

function classifyByKeywords(content: string): 'promotional' | 'educational' | 'entertaining' | 'inspirational' {
  const lower = content.toLowerCase()
  const scores = {
    promotional: PROMOTIONAL_KEYWORDS.filter(k => lower.includes(k)).length,
    educational: EDUCATIONAL_KEYWORDS.filter(k => lower.includes(k)).length,
    entertaining: ENTERTAINING_KEYWORDS.filter(k => lower.includes(k)).length,
    inspirational: INSPIRATIONAL_KEYWORDS.filter(k => lower.includes(k)).length,
  }

  const maxScore = Math.max(...Object.values(scores))
  if (maxScore === 0) return 'educational'

  const entries = Object.entries(scores) as [keyof typeof scores, number][]
  return entries.reduce((best, [key, val]) => val > best[1] ? [key, val] : best, entries[0])[0]
}

function generateRecommendation(mix: { promotional: number; educational: number; entertaining: number; inspirational: number }, total: number): string {
  if (total === 0) return 'Start posting content to get mix recommendations.'

  const idealMix = { promotional: 0.2, educational: 0.4, entertaining: 0.2, inspirational: 0.2 }
  const actual = {
    promotional: mix.promotional / total,
    educational: mix.educational / total,
    entertaining: mix.entertaining / total,
    inspirational: mix.inspirational / total,
  }

  const issues: string[] = []
  if (actual.promotional > 0.35) issues.push('Too much promotional content - aim for under 20%')
  if (actual.educational < 0.25) issues.push('Add more educational content - it builds authority and trust')
  if (actual.entertaining < 0.1 && total > 5) issues.push('Include some entertaining content to boost engagement')
  if (actual.inspirational < 0.1 && total > 5) issues.push('Sprinkle in inspirational posts to connect emotionally')

  if (issues.length === 0) return 'Your content mix looks well-balanced! Keep it up.'
  return issues.join('. ') + '.'
}

const CLASSIFY_PROMPT = `You are a content classifier. Classify each social media post into exactly ONE of these categories:
- promotional: Sales, product launches, discounts, offers
- educational: Tips, how-tos, guides, insights, knowledge sharing
- entertaining: Humor, memes, stories, behind-the-scenes, fun content
- inspirational: Motivation, success stories, mindset, personal growth

Respond with ONLY a JSON array of category strings in the same order as the posts provided. Example:
["educational","promotional","entertaining","inspirational","educational"]`

export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  try {
    const { data: posts, error } = await admin
      .from('social_posts')
      .select('id, content, platform, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error && error.code === '42P01') {
      return NextResponse.json({
        mix: { promotional: 0, educational: 0, entertaining: 0, inspirational: 0 },
        total: 0,
        recommendation: 'Start posting content to get mix recommendations.',
      })
    }

    const allPosts = (posts || []).filter(p => p.content && p.content.trim().length > 0)
    const total = allPosts.length

    if (total === 0) {
      return NextResponse.json({
        mix: { promotional: 0, educational: 0, entertaining: 0, inspirational: 0 },
        total: 0,
        recommendation: 'No content found to analyze. Start posting to get recommendations.',
      })
    }

    const mix = { promotional: 0, educational: 0, entertaining: 0, inspirational: 0 }

    const { enabled, settings: aiSettings } = await getAISettings()

    if (enabled) {
      try {
        const postContents = allPosts.map((p, i) => `${i + 1}. ${p.content.slice(0, 200)}`).join('\n')

        const result = await chatCompletion(
          { ...aiSettings, systemPrompt: CLASSIFY_PROMPT },
          [{ role: 'user', content: `Classify these ${total} posts:\n\n${postContents}` }]
        )

        let classifications: string[] = []
        try {
          const cleaned = result.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
          classifications = JSON.parse(cleaned)
        } catch {
          classifications = []
        }

        if (Array.isArray(classifications) && classifications.length === total) {
          for (const cat of classifications) {
            const key = cat as keyof typeof mix
            if (mix[key] !== undefined) {
              mix[key]++
            } else {
              mix.educational++
            }
          }
        } else {
          for (const post of allPosts) {
            mix[classifyByKeywords(post.content)]++
          }
        }
      } catch {
        for (const post of allPosts) {
          mix[classifyByKeywords(post.content)]++
        }
      }
    } else {
      for (const post of allPosts) {
        mix[classifyByKeywords(post.content)]++
      }
    }

    const recommendation = generateRecommendation(mix, total)

    return NextResponse.json({ mix, total, recommendation })
  } catch (error) {
    return NextResponse.json({ error: `Failed to analyze content mix: ${(error as Error).message}` }, { status: 500 })
  }
}
