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

const GRADE_PROMPT = `You are a content quality analyst. Grade the provided content on four dimensions, each scored 0-25 (total max 100).

DIMENSIONS:
1. Readability (0-25): Clarity, sentence structure, flow, grammar
2. SEO Strength (0-25): Keyword usage, headline quality, meta-friendliness, structure
3. Emotional Engagement (0-25): Hook strength, storytelling, call-to-action, relatability
4. Platform Fit (0-25): Appropriate length, tone, format for the specified platform

GRADING SCALE:
- A: 80-100
- B: 60-79
- C: 40-59
- D: 0-39

Provide 3-5 actionable improvement tips.

Respond with ONLY this JSON (no other text):
{"grade":"A","score":85,"readability":22,"seo":20,"engagement":23,"platformFit":20,"tips":["tip1","tip2","tip3"]}`

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { enabled, settings: aiSettings } = await getAISettings()
  if (!enabled) {
    return NextResponse.json({ error: 'AI features are not enabled. Enable AI in admin settings to use the content grader.' }, { status: 403 })
  }

  let body: { content?: string; platform?: string; type?: 'blog' | 'social' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const truncatedContent = body.content.length > 4000 ? body.content.slice(0, 4000) + '...' : body.content
  const platform = body.platform || 'general'
  const contentType = body.type || 'social'

  try {
    const result = await chatCompletion(
      { ...aiSettings, systemPrompt: GRADE_PROMPT },
      [{
        role: 'user',
        content: `Platform: ${platform}\nContent Type: ${contentType}\n\nContent to grade:\n${truncatedContent}`,
      }]
    )

    let grade: any
    try {
      const cleaned = result.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      grade = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    return NextResponse.json(grade)
  } catch (error) {
    return NextResponse.json({ error: `Failed to grade content: ${(error as Error).message}` }, { status: 500 })
  }
}
