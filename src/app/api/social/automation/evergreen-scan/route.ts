import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
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

const safeFetch = async (queryFn: () => PromiseLike<{ data: any; error: any }>) => {
  try {
    const result = await queryFn()
    if (result.error?.code === '42P01' || result.error?.message?.includes('does not exist')) return { data: [] }
    return { data: result.data || [] }
  } catch { return { data: [] } }
}

const SEASONAL_WORDS = [
  'christmas', 'easter', 'halloween', 'thanksgiving', 'new year', 'valentine',
  'summer', 'winter', 'spring', 'fall', 'autumn', 'holiday', 'season',
  'black friday', 'cyber monday', 'back to school', 'memorial day', 'labor day',
]

const TRENDING_WORDS = [
  'breaking', 'just announced', 'this week', 'this month', 'today',
  'latest', 'new release', 'just launched', 'trending', 'viral',
  'update:', 'breaking:', 'news:',
]

const DATE_PATTERN = /\b(20\d{2}|january|february|march|april|may|june|july|august|september|october|november|december|q[1-4])\b/i

function heuristicEvergreenScore(title: string, content: string): { score: number; label: 'evergreen' | 'seasonal' | 'dated'; reason: string } {
  const text = `${title} ${content}`.toLowerCase()
  let score = 75
  const reasons: string[] = []

  const dateMatches = text.match(new RegExp(DATE_PATTERN, 'gi')) || []
  if (dateMatches.length > 3) {
    score -= 30
    reasons.push(`Contains ${dateMatches.length} date references`)
  } else if (dateMatches.length > 0) {
    score -= dateMatches.length * 8
    reasons.push(`Contains ${dateMatches.length} date reference(s)`)
  }

  const seasonalCount = SEASONAL_WORDS.filter(w => text.includes(w)).length
  if (seasonalCount > 0) {
    score -= seasonalCount * 12
    reasons.push(`References ${seasonalCount} seasonal term(s)`)
  }

  const trendingCount = TRENDING_WORDS.filter(w => text.includes(w)).length
  if (trendingCount > 0) {
    score -= trendingCount * 10
    reasons.push(`Contains ${trendingCount} time-sensitive term(s)`)
  }

  const howTo = /\b(how to|guide|tutorial|tips|best practices|fundamentals|introduction|beginner)\b/i
  if (howTo.test(text)) {
    score += 10
    reasons.push('Contains evergreen educational keywords')
  }

  score = Math.max(0, Math.min(100, score))

  let label: 'evergreen' | 'seasonal' | 'dated'
  if (score >= 65) label = 'evergreen'
  else if (score >= 35) label = 'seasonal'
  else label = 'dated'

  return { score, label, reason: reasons.length > 0 ? reasons.join('; ') : 'No strong time-sensitivity signals detected' }
}

const EVERGREEN_PROMPT = `You are a content analyst. Analyze each blog post and score its "evergreen-ness" on a scale of 0-100.

SCORING CRITERIA:
- 80-100: Truly evergreen - timeless advice, tutorials, how-tos, fundamentals
- 60-79: Mostly evergreen - some time references but core content stays relevant
- 40-59: Seasonal - tied to specific seasons, events, or periods
- 0-39: Dated - tied to specific dates, news events, or trends that expire

For each article, return:
- evergreenScore (0-100)
- label: "evergreen" (65+), "seasonal" (35-64), or "dated" (0-34)
- reason: Brief explanation of why

Return ONLY a JSON array matching the input order:
[{"evergreenScore": 85, "label": "evergreen", "reason": "Timeless how-to guide with no date references"}]`

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const { data: posts } = await safeFetch(() =>
    admin
      .from('blog_posts')
      .select('id, title, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  )

  if (!posts || posts.length === 0) {
    return NextResponse.json({ articles: [] })
  }

  const { enabled, settings: aiSettings } = await getAISettings()

  if (enabled) {
    try {
      const summaries = posts.map((p: any) => {
        const snippet = (p.content || '').slice(0, 500)
        return `Title: ${p.title}\nContent preview: ${snippet}`
      }).join('\n---\n')

      const result = await chatCompletion(
        { ...aiSettings, systemPrompt: EVERGREEN_PROMPT },
        [{
          role: 'user',
          content: `Analyze these ${posts.length} blog posts for evergreen-ness:\n\n${summaries}`,
        }]
      )

      let scores: Array<{ evergreenScore: number; label: string; reason: string }> = []
      try {
        const cleaned = result.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
        scores = JSON.parse(cleaned)
      } catch {}

      if (Array.isArray(scores) && scores.length === posts.length) {
        const articles = posts.map((p: any, i: number) => ({
          id: p.id,
          title: p.title,
          evergreenScore: scores[i].evergreenScore,
          label: scores[i].label as 'evergreen' | 'seasonal' | 'dated',
          reason: scores[i].reason,
        }))
        return NextResponse.json({ articles })
      }
    } catch (error) {
      console.warn('[EvergreenScan] AI scoring failed, falling back to heuristic:', (error as Error).message)
    }
  }

  const articles = posts.map((p: any) => {
    const { score, label, reason } = heuristicEvergreenScore(p.title || '', p.content || '')
    return {
      id: p.id,
      title: p.title,
      evergreenScore: score,
      label,
      reason,
    }
  })

  return NextResponse.json({ articles })
}
