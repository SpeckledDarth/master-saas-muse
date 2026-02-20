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

function getEngagementScore(data: any): number {
  if (!data || typeof data !== 'object') return 0
  const likes = Number(data.likes || data.like_count || 0)
  const comments = Number(data.comments || data.comment_count || 0)
  const shares = Number(data.shares || data.share_count || data.retweets || data.reposts || 0)
  return likes + comments * 2 + shares * 3
}

export async function POST(_request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { enabled, settings: aiSettings } = await getAISettings()
  if (!enabled) {
    return NextResponse.json({ error: 'AI features are not enabled. Enable AI in admin settings to use Audience Persona Builder.' }, { status: 403 })
  }

  const admin = getSupabaseAdmin()

  const safeFetch = async (queryFn: () => PromiseLike<{ data: any; error: any }>) => {
    try {
      const r = await queryFn()
      if (r.error?.code === '42P01' || r.error?.message?.includes('does not exist')) return { data: [] }
      return { data: r.data || [] }
    } catch {
      return { data: [] }
    }
  }

  const postsRes = await safeFetch(() =>
    admin.from('social_posts')
      .select('id, platform, content, engagement_data, posted_at, created_at, status')
      .eq('user_id', user.id)
      .eq('status', 'posted')
      .order('created_at', { ascending: false })
      .limit(50)
  )

  const posts: any[] = postsRes.data as any[]

  const postsSummary = posts.map(p => ({
    platform: p.platform,
    content: (p.content || '').slice(0, 200),
    engagement: getEngagementScore(p.engagement_data),
    date: (p.posted_at || p.created_at || '').slice(0, 10),
  }))

  const systemPrompt = `You are a social media audience analyst. Based on the following social media posts and their engagement data, generate 2-3 audience personas. Each persona should represent a distinct segment of the audience that engages with this content.

For each persona, provide:
- name: A descriptive persona name (e.g., "Tech-Savvy Professional")
- ageRange: Estimated age range (e.g., "25-34")
- interests: Array of 3-5 interests
- contentPreferences: Array of 2-4 content types they prefer
- preferredPlatform: Which platform they're most active on
- bestTime: Best time to reach them (e.g., "Weekday mornings 8-10 AM")

Return ONLY a valid JSON array of persona objects. No markdown, no explanation.`

  try {
    const result = await chatCompletion(
      { ...aiSettings, systemPrompt },
      [{
        role: 'user',
        content: `Here are my recent social media posts with engagement scores:\n\n${JSON.stringify(postsSummary, null, 2)}\n\nGenerate 2-3 audience personas based on this data.`,
      }]
    )

    let personas: Array<{
      name: string
      ageRange: string
      interests: string[]
      contentPreferences: string[]
      preferredPlatform: string
      bestTime: string
    }> = []

    try {
      const cleaned = result.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      personas = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response into personas format' }, { status: 500 })
    }

    if (!Array.isArray(personas)) {
      return NextResponse.json({ error: 'AI returned invalid personas format' }, { status: 500 })
    }

    return NextResponse.json({ personas })
  } catch (error) {
    return NextResponse.json({ error: `Failed to generate audience personas: ${(error as Error).message}` }, { status: 500 })
  }
}
