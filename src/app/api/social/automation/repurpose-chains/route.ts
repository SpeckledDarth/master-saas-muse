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

const REPURPOSE_CHAINS_PROMPT = `You are a content repurposing expert. Take the provided blog post and generate 5 different output formats.

Return ONLY this JSON object (no other text):
{
  "socialSnippets": [
    {"platform": "twitter", "content": "tweet text #hashtag"},
    {"platform": "linkedin", "content": "linkedin post text"},
    {"platform": "facebook", "content": "facebook post text"},
    {"platform": "twitter", "content": "another tweet #hashtag"},
    {"platform": "instagram", "content": "instagram caption text"}
  ],
  "tweetThread": ["hook tweet", "point 1", "point 2", "point 3", "point 4", "point 5", "point 6", "point 7", "CTA tweet"],
  "emailBlurb": "A 2-3 paragraph email newsletter section summarizing the blog post with a CTA to read more.",
  "linkedinSummary": "A 150-300 word LinkedIn article summary that provides key insights and encourages discussion.",
  "instagramCaption": "An engaging Instagram caption (under 2200 chars) with relevant hashtags and a call-to-action."
}

RULES:
- socialSnippets: Exactly 5 posts across different platforms, each with unique angle
- tweetThread: 8-12 tweets, each max 280 chars, structured as hook > key points > CTA
- emailBlurb: Professional tone, 2-3 paragraphs, include a [READ_MORE] placeholder
- linkedinSummary: Thought leadership tone, 150-300 words
- instagramCaption: Engaging, includes 5-10 hashtags, under 2200 chars`

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { enabled, settings: aiSettings } = await getAISettings()
  if (!enabled) {
    return NextResponse.json({ error: 'AI features are not enabled. Enable AI in admin settings to use Repurpose Chains.' }, { status: 403 })
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
      { ...aiSettings, systemPrompt: REPURPOSE_CHAINS_PROMPT },
      [{
        role: 'user',
        content: `Blog Title: ${title}\n\nBlog Content:\n${truncatedContent}`,
      }]
    )

    let chains: any
    try {
      const cleaned = result.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      chains = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response into repurpose chain format' }, { status: 500 })
    }

    return NextResponse.json({
      socialSnippets: chains.socialSnippets || [],
      tweetThread: chains.tweetThread || [],
      emailBlurb: chains.emailBlurb || '',
      linkedinSummary: chains.linkedinSummary || '',
      instagramCaption: chains.instagramCaption || '',
    })
  } catch (error) {
    return NextResponse.json({ error: `Failed to generate repurpose chains: ${(error as Error).message}` }, { status: 500 })
  }
}
