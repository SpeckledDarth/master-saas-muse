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

const BRIEF_PROMPT = `You are a content strategist. Generate a comprehensive content brief for the given topic.

The brief should include:
1. Three compelling title suggestions (varied styles: listicle, how-to, thought leadership)
2. A structured outline with H2 headings and H3 subheadings
3. 5-8 target keywords for SEO
4. Ideal content length recommendation
5. Estimated read time
6. Best target platforms for this content

Respond with ONLY this JSON (no other text):
{
  "titles": ["Title 1", "Title 2", "Title 3"],
  "outline": [
    {"heading": "H2 Section Title", "subheadings": ["H3 Sub 1", "H3 Sub 2"]},
    {"heading": "H2 Section Title 2", "subheadings": ["H3 Sub 1"]}
  ],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "idealLength": "1,500-2,000 words",
  "estimatedReadTime": "7-8 minutes",
  "targetPlatforms": ["blog", "linkedin", "twitter"]
}`

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { enabled, settings: aiSettings } = await getAISettings()
  if (!enabled) {
    return NextResponse.json({ error: 'AI features are not enabled. Enable AI in admin settings to generate content briefs.' }, { status: 403 })
  }

  let body: { topic?: string; platform?: string; niche?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.topic || typeof body.topic !== 'string' || body.topic.trim().length === 0) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
  }

  const platform = body.platform || 'blog'
  const niche = body.niche || 'general'

  try {
    const result = await chatCompletion(
      { ...aiSettings, systemPrompt: BRIEF_PROMPT },
      [{
        role: 'user',
        content: `Topic: ${body.topic.trim()}\nTarget Platform: ${platform}\nNiche/Industry: ${niche}`,
      }]
    )

    let brief: any
    try {
      const cleaned = result.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      brief = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    return NextResponse.json(brief)
  } catch (error) {
    return NextResponse.json({ error: `Failed to generate content brief: ${(error as Error).message}` }, { status: 500 })
  }
}
