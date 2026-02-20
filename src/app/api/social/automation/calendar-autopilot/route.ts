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
    return NextResponse.json({ error: 'AI features are not enabled. Enable AI in admin settings to use Calendar Autopilot.' }, { status: 403 })
  }

  let body: { postsPerWeek?: number; platforms?: string[]; startDate?: string; weeks?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const postsPerWeek = body.postsPerWeek
  const platforms = body.platforms
  const weeks = body.weeks || 4
  const startDate = body.startDate || new Date().toISOString().split('T')[0]

  if (!postsPerWeek || typeof postsPerWeek !== 'number' || postsPerWeek < 1 || postsPerWeek > 28) {
    return NextResponse.json({ error: 'postsPerWeek must be a number between 1 and 28' }, { status: 400 })
  }

  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return NextResponse.json({ error: 'platforms must be a non-empty array of platform names' }, { status: 400 })
  }

  if (weeks < 1 || weeks > 12) {
    return NextResponse.json({ error: 'weeks must be between 1 and 12' }, { status: 400 })
  }

  const totalPosts = postsPerWeek * weeks
  const systemPrompt = `You are a social media content strategist. Generate a content calendar with ${postsPerWeek} posts per week across ${platforms.join(', ')} for ${weeks} weeks starting from ${startDate}. Mix educational (40%), entertaining (30%), promotional (20%), inspirational (10%). Return ONLY a JSON array of objects with fields: date (YYYY-MM-DD), platform, content (the actual post text), type (one of: educational, entertaining, promotional, inspirational). Distribute posts evenly across the week and platforms. Generate exactly ${totalPosts} posts total.`

  try {
    const result = await chatCompletion(
      { ...aiSettings, systemPrompt },
      [{
        role: 'user',
        content: `Generate a ${weeks}-week content calendar with ${postsPerWeek} posts per week across these platforms: ${platforms.join(', ')}. Start date: ${startDate}. Total posts needed: ${totalPosts}.`,
      }]
    )

    let calendar: Array<{ date: string; platform: string; content: string; type: string }> = []
    try {
      const cleaned = result.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      calendar = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response into calendar format' }, { status: 500 })
    }

    if (!Array.isArray(calendar)) {
      return NextResponse.json({ error: 'AI returned invalid calendar format' }, { status: 500 })
    }

    return NextResponse.json({ calendar, totalPosts: calendar.length })
  } catch (error) {
    return NextResponse.json({ error: `Failed to generate content calendar: ${(error as Error).message}` }, { status: 500 })
  }
}
