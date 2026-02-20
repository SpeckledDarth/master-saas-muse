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

const REPURPOSE_PROMPT = `You are a social media content strategist. Your job is to take a blog post and create social media snippets that drive traffic back to the original article.

RULES:
1. Generate exactly 5-7 social media posts from the blog content
2. Each post should be for a DIFFERENT angle or key takeaway from the article
3. Each post MUST include a placeholder [BLOG_LINK] where the article URL should go
4. Vary the style: some should be quotes/insights, some questions, some statistics/facts, some calls-to-action
5. Keep posts short and punchy — optimized for engagement
6. Include 1-3 relevant hashtags per post
7. Do NOT repeat the same point in different words

OUTPUT FORMAT (respond with ONLY this JSON array, no other text):
[
  {"platform": "twitter", "content": "post text here [BLOG_LINK] #hashtag"},
  {"platform": "linkedin", "content": "longer post text here [BLOG_LINK]"},
  ...
]

Use a mix of platforms: twitter (2-3 posts), linkedin (1-2 posts), facebook (1-2 posts).`

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { enabled, settings: aiSettings } = await getAISettings()
  if (!enabled) {
    return NextResponse.json({ error: 'AI features are not enabled. Enable AI in admin settings to use the repurpose engine.' }, { status: 403 })
  }

  let body: { blogPostId?: string; title?: string; content?: string; blogUrl?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  let title = body.title || ''
  let content = body.content || ''
  let blogUrl = body.blogUrl || ''

  if (body.blogPostId) {
    const admin = getSupabaseAdmin()
    const { data: post } = await admin
      .from('blog_posts')
      .select('title, content, published_urls')
      .eq('id', body.blogPostId)
      .eq('user_id', user.id)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    title = post.title
    content = post.content
    const urls = post.published_urls as Record<string, string>
    blogUrl = blogUrl || Object.values(urls)[0] || '[BLOG_LINK]'
  }

  if (!title || !content) {
    return NextResponse.json({ error: 'Blog post title and content are required' }, { status: 400 })
  }

  const truncatedContent = content.length > 4000 ? content.slice(0, 4000) + '...' : content

  try {
    const result = await chatCompletion(
      { ...aiSettings, systemPrompt: REPURPOSE_PROMPT },
      [{
        role: 'user',
        content: `Blog Title: ${title}\n\nBlog Content:\n${truncatedContent}\n\nBlog URL: ${blogUrl || '[BLOG_LINK]'}`,
      }]
    )

    let snippets: Array<{ platform: string; content: string }> = []
    try {
      const cleaned = result.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      snippets = JSON.parse(cleaned)
    } catch {
      snippets = [{ platform: 'twitter', content: result.content }]
    }

    if (blogUrl && blogUrl !== '[BLOG_LINK]') {
      snippets = snippets.map(s => ({
        ...s,
        content: s.content.replace(/\[BLOG_LINK\]/g, blogUrl),
      }))
    }

    if (body.blogPostId) {
      try {
        const admin = getSupabaseAdmin()
        await admin
          .from('blog_posts')
          .update({ repurposed: true, repurpose_count: snippets.length })
          .eq('id', body.blogPostId)
          .eq('user_id', user.id)
      } catch {}
    }

    return NextResponse.json({ snippets, count: snippets.length })
  } catch (error) {
    return NextResponse.json({ error: `Failed to generate snippets: ${(error as Error).message}` }, { status: 500 })
  }
}
