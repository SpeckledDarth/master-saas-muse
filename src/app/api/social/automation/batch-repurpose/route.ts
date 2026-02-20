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

const REPURPOSE_PROMPT = `You are a social media content strategist. Your job is to take a blog post and create social media snippets that drive traffic back to the original article.

RULES:
1. Generate exactly 5-7 social media posts from the blog content
2. Each post should be for a DIFFERENT angle or key takeaway from the article
3. Each post MUST include a placeholder [BLOG_LINK] where the article URL should go
4. Vary the style: some should be quotes/insights, some questions, some statistics/facts, some calls-to-action
5. Keep posts short and punchy - optimized for engagement
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
    return NextResponse.json({ error: 'AI features are not enabled. Enable AI in admin settings to use batch repurpose.' }, { status: 403 })
  }

  let body: { blogPostIds?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.blogPostIds || !Array.isArray(body.blogPostIds) || body.blogPostIds.length === 0) {
    return NextResponse.json({ error: 'blogPostIds must be a non-empty array of blog post IDs' }, { status: 400 })
  }

  if (body.blogPostIds.length > 5) {
    return NextResponse.json({ error: 'Maximum 5 blog posts can be repurposed at once' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const results: Array<{ blogPostId: string; title: string; snippetCount: number; snippets: Array<{ platform: string; content: string }> }> = []

  for (const blogPostId of body.blogPostIds) {
    const { data: posts } = await safeFetch(() =>
      admin
        .from('blog_posts')
        .select('id, title, content, published_urls')
        .eq('id', blogPostId)
        .eq('user_id', user.id)
    )

    const post = Array.isArray(posts) ? posts[0] : null
    if (!post) {
      results.push({ blogPostId, title: 'Not found', snippetCount: 0, snippets: [] })
      continue
    }

    const truncatedContent = post.content?.length > 4000 ? post.content.slice(0, 4000) + '...' : (post.content || '')
    const urls = (post.published_urls || {}) as Record<string, string>
    const blogUrl = Object.values(urls)[0] || '[BLOG_LINK]'

    try {
      const result = await chatCompletion(
        { ...aiSettings, systemPrompt: REPURPOSE_PROMPT },
        [{
          role: 'user',
          content: `Blog Title: ${post.title}\n\nBlog Content:\n${truncatedContent}\n\nBlog URL: ${blogUrl}`,
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

      try {
        const socialPosts = snippets.map(s => ({
          user_id: user.id,
          platform: s.platform,
          content: s.content,
          status: 'draft',
          source_blog_id: blogPostId,
          created_at: new Date().toISOString(),
        }))
        await admin.from('social_posts').insert(socialPosts)
      } catch (saveErr) {
        console.warn('[BatchRepurpose] Could not save snippets as social posts:', (saveErr as Error).message)
      }

      try {
        await admin
          .from('blog_posts')
          .update({ repurposed: true, repurpose_count: snippets.length })
          .eq('id', blogPostId)
          .eq('user_id', user.id)
      } catch {}

      results.push({ blogPostId, title: post.title, snippetCount: snippets.length, snippets })
    } catch (error) {
      results.push({ blogPostId, title: post.title, snippetCount: 0, snippets: [] })
    }
  }

  return NextResponse.json({ results })
}
