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

const safeFetch = async (queryFn: () => PromiseLike<{ data: any; error: any }>) => {
  try {
    const result = await queryFn()
    if (result.error?.code === '42P01' || result.error?.message?.includes('does not exist')) return { data: [] }
    return { data: result.data || [] }
  } catch { return { data: [] } }
}

const THREAD_PROMPT = `Convert this blog post into a Twitter/X thread. Structure:
1) Hook tweet that grabs attention
2-10) Key points from the article (one per tweet)
11) CTA tweet with blog link

Each tweet max 280 chars. Return ONLY a JSON array of strings, no other text. Example:
["Hook tweet here...", "Point 1 here...", "Point 2 here...", "CTA tweet here [BLOG_LINK]"]

Generate 8-12 tweets total. Make each tweet self-contained but connected to the thread narrative.`

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { enabled, settings: aiSettings } = await getAISettings()
  if (!enabled) {
    return NextResponse.json({ error: 'AI features are not enabled. Enable AI in admin settings to use Blog-to-Thread.' }, { status: 403 })
  }

  let body: { blogPostId?: string; title?: string; content?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  let title = body.title || ''
  let content = body.content || ''

  if (body.blogPostId) {
    const admin = getSupabaseAdmin()
    const { data: posts } = await safeFetch(() =>
      admin
        .from('blog_posts')
        .select('title, content')
        .eq('id', body.blogPostId!)
        .eq('user_id', user.id)
    )

    const post = Array.isArray(posts) ? posts[0] : null
    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    title = post.title
    content = post.content
  }

  if (!title || !content) {
    return NextResponse.json({ error: 'Blog post title and content are required. Provide blogPostId or both title and content.' }, { status: 400 })
  }

  const truncatedContent = content.length > 4000 ? content.slice(0, 4000) + '...' : content

  try {
    const result = await chatCompletion(
      { ...aiSettings, systemPrompt: THREAD_PROMPT },
      [{
        role: 'user',
        content: `Blog Title: ${title}\n\nBlog Content:\n${truncatedContent}`,
      }]
    )

    let thread: string[] = []
    try {
      const cleaned = result.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      thread = JSON.parse(cleaned)
    } catch {
      thread = result.content.split('\n').filter((line: string) => line.trim().length > 0)
    }

    if (!Array.isArray(thread)) {
      return NextResponse.json({ error: 'AI returned invalid thread format' }, { status: 500 })
    }

    return NextResponse.json({ thread, tweetCount: thread.length })
  } catch (error) {
    return NextResponse.json({ error: `Failed to generate thread: ${(error as Error).message}` }, { status: 500 })
  }
}
