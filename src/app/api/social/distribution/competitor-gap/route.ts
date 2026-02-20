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

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { enabled, settings: aiSettings } = await getAISettings()
  if (!enabled) {
    return NextResponse.json({ error: 'AI features are not enabled. Enable AI in admin settings to use Competitor Gap Analysis.' }, { status: 403 })
  }

  let body: { competitors?: Array<{ name: string; description: string }>; niche?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const competitors = body.competitors
  const niche = body.niche || ''

  if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
    return NextResponse.json({ error: 'competitors must be a non-empty array of {name, description} objects' }, { status: 400 })
  }

  if (competitors.length > 10) {
    return NextResponse.json({ error: 'Maximum 10 competitors allowed' }, { status: 400 })
  }

  for (const c of competitors) {
    if (!c.name || typeof c.name !== 'string') {
      return NextResponse.json({ error: 'Each competitor must have a name' }, { status: 400 })
    }
  }

  const systemPrompt = `You are a content strategist specializing in competitive analysis. Based on the competitor descriptions and niche provided, identify content gaps - topics or angles that competitors are NOT covering well, that the user could capitalize on.

For each gap, provide:
- topic: The content topic or angle
- description: Why this is a gap and how to approach it
- difficulty: "easy", "medium", or "hard" based on expertise and resources needed
- potentialImpact: "high", "medium", or "low" based on audience interest and competitive advantage
- briefSuggestion: A one-sentence content brief for the first piece covering this gap

Return ONLY a valid JSON array of 4-6 gap objects. No markdown, no explanation.`

  const competitorSummary = competitors.map(c => `- ${c.name}: ${c.description || 'No description provided'}`).join('\n')

  try {
    const result = await chatCompletion(
      { ...aiSettings, systemPrompt },
      [{
        role: 'user',
        content: `My niche: ${niche || 'Not specified'}\n\nCompetitors:\n${competitorSummary}\n\nIdentify 4-6 content gaps I can exploit.`,
      }]
    )

    let gaps: Array<{
      topic: string
      description: string
      difficulty: 'easy' | 'medium' | 'hard'
      potentialImpact: 'high' | 'medium' | 'low'
      briefSuggestion: string
    }> = []

    try {
      const cleaned = result.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      gaps = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response into gap analysis format' }, { status: 500 })
    }

    if (!Array.isArray(gaps)) {
      return NextResponse.json({ error: 'AI returned invalid gap analysis format' }, { status: 500 })
    }

    return NextResponse.json({ gaps })
  } catch (error) {
    return NextResponse.json({ error: `Failed to generate competitor gap analysis: ${(error as Error).message}` }, { status: 500 })
  }
}
