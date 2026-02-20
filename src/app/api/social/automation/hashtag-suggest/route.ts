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

function extractKeywordHashtags(content: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'it', 'its', 'this', 'that', 'these', 'those',
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his',
    'she', 'her', 'they', 'them', 'their', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'not', 'no', 'nor', 'as', 'if',
    'then', 'than', 'too', 'very', 'just', 'about', 'above', 'after',
    'again', 'all', 'am', 'any', 'because', 'before', 'below', 'between',
    'both', 'each', 'few', 'further', 'get', 'got', 'here', 'into',
    'more', 'most', 'new', 'now', 'only', 'other', 'out', 'own', 'same',
    'so', 'some', 'such', 'up', 'down', 'off', 'over', 'under', 'until',
    'while', 'also', 'back', 'even', 'still', 'well', 'way', 'use',
    'make', 'like', 'long', 'look', 'many', 'much', 'take', 'come',
    'want', 'say', 'going', 'know', 'see', 'thing', 'let', 'us',
  ])

  const cleaned = content
    .replace(/https?:\/\/\S+/g, '')
    .replace(/#\w+/g, '')
    .replace(/@\w+/g, '')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .toLowerCase()

  const words = cleaned.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w))

  const freq: Record<string, number> = {}
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1
  }

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)

  const count = Math.min(Math.max(3, Math.min(sorted.length, 5)), 5)
  return sorted.slice(0, count).map(word => {
    const capitalized = word.charAt(0).toUpperCase() + word.slice(1)
    return `#${capitalized}`
  })
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { content?: string; platform?: string; niche?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { content, platform, niche } = body

  if (!content || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  if (!platform || typeof platform !== 'string') {
    return NextResponse.json({ error: 'platform is required' }, { status: 400 })
  }

  const { enabled, settings: aiSettings } = await getAISettings()

  if (!enabled) {
    const hashtags = extractKeywordHashtags(content)
    return NextResponse.json({ hashtags, source: 'keyword' })
  }

  const nicheContext = niche ? ` Consider the niche: ${niche}.` : ''
  const systemPrompt = `Based on this social media post for ${platform}, suggest 3-5 relevant hashtags that would increase reach and engagement.${nicheContext} Return JSON array of strings (just the hashtags with # prefix).`

  try {
    const result = await chatCompletion(
      { ...aiSettings, systemPrompt },
      [{
        role: 'user',
        content: content.trim(),
      }]
    )

    let hashtags: string[] = []
    try {
      const cleaned = result.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      hashtags = JSON.parse(cleaned)
    } catch {
      const matches = result.content.match(/#\w+/g)
      hashtags = matches ? [...new Set(matches)].slice(0, 5) : []
    }

    if (!Array.isArray(hashtags)) {
      hashtags = []
    }

    hashtags = hashtags
      .filter((h): h is string => typeof h === 'string' && h.startsWith('#'))
      .slice(0, 5)

    if (hashtags.length === 0) {
      const fallback = extractKeywordHashtags(content)
      return NextResponse.json({ hashtags: fallback, source: 'keyword' })
    }

    return NextResponse.json({ hashtags, source: 'ai' })
  } catch {
    const fallback = extractKeywordHashtags(content)
    return NextResponse.json({ hashtags: fallback, source: 'keyword' })
  }
}
