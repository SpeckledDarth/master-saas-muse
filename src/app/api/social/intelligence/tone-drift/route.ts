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

const TONE_DRIFT_PROMPT = `You are a brand voice analyst. Compare the provided social media posts against the specified brand voice guidelines.

Analyze for:
1. Alignment score (0-100): How well the posts match the brand voice
2. Whether there is meaningful drift from the brand voice
3. A brief description of any drift detected
4. The recent tone observed across the posts

Respond with ONLY this JSON (no other text):
{"alignment":85,"drift":false,"driftDescription":"Posts are mostly aligned with brand voice","recentTone":"Professional and informative"}`

export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  const { enabled, settings: aiSettings } = await getAISettings()
  if (!enabled) {
    return NextResponse.json(
      { error: 'AI features are not enabled. Enable AI in admin settings to use tone drift monitoring.' },
      { status: 403 }
    )
  }

  const safeFetch = async (queryFn: () => PromiseLike<{ data: any; error: any }>) => {
    try {
      const result = await queryFn()
      if (result.error?.code === '42P01' || result.error?.message?.includes('does not exist')) {
        return { data: null }
      }
      return { data: result.data }
    } catch {
      return { data: null }
    }
  }

  try {
    const settingsRes = await safeFetch(() =>
      admin.from('organization_settings')
        .select('settings')
        .eq('app_id', 'default')
        .single()
    )

    const orgSettings = (settingsRes.data?.settings || {}) as any
    const brandVoice = orgSettings?.socialModule?.brandVoice || orgSettings?.brandVoice || ''

    if (!brandVoice || brandVoice.trim().length === 0) {
      return NextResponse.json({ configured: false })
    }

    const postsRes = await safeFetch(() =>
      admin.from('social_posts')
        .select('content')
        .eq('user_id', user.id)
        .not('content', 'is', null)
        .order('created_at', { ascending: false })
        .limit(15)
    )

    const posts: any[] = postsRes.data || []
    const postContents = posts
      .map((p: any) => p.content)
      .filter((c: string) => c && c.trim().length > 0)

    if (postContents.length === 0) {
      return NextResponse.json({
        configured: true,
        alignment: 100,
        drift: false,
        driftDescription: 'No posts available to analyze',
        recentTone: 'N/A',
      })
    }

    const postsText = postContents
      .map((c: string, i: number) => `Post ${i + 1}: ${c.slice(0, 500)}`)
      .join('\n\n')

    const result = await chatCompletion(
      { ...aiSettings, systemPrompt: TONE_DRIFT_PROMPT },
      [{
        role: 'user',
        content: `Brand Voice Setting: ${brandVoice}\n\nRecent Posts:\n${postsText}`,
      }]
    )

    let analysis: any
    try {
      const cleaned = result.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      analysis = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    return NextResponse.json({
      configured: true,
      alignment: Math.max(0, Math.min(100, Number(analysis.alignment) || 50)),
      drift: Boolean(analysis.drift),
      driftDescription: String(analysis.driftDescription || ''),
      recentTone: String(analysis.recentTone || ''),
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to analyze tone drift: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
