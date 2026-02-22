import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getBlogClient } from '@/lib/social/blog-clients'
import { decryptToken } from '@/lib/social/crypto'
import type { BlogPlatform } from '@/lib/social/types'

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} }
    }
  })
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: { postId?: string; platforms?: string[] }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { postId, platforms } = body
    if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 })

    const admin = getSupabaseAdmin()

    const { data: post, error: postError } = await admin
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    if (!post.title || !post.content) {
      return NextResponse.json({ error: 'Blog post must have a title and content' }, { status: 400 })
    }

    const targetPlatforms = (platforms || post.platforms || []) as BlogPlatform[]
    if (targetPlatforms.length === 0) {
      return NextResponse.json({ error: 'No target platforms specified' }, { status: 400 })
    }

    const { data: connections } = await admin
      .from('blog_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_valid', true)
      .in('platform', targetPlatforms)

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        error: 'No valid blog connections found for the selected platforms. Please connect your blog accounts first.',
      }, { status: 400 })
    }

    await admin.from('blog_posts').update({ status: 'publishing' }).eq('id', postId)

    const results: Record<string, { success: boolean; url?: string; error?: string }> = {}
    const publishedUrls: Record<string, string> = { ...(post.published_urls || {}) }

    for (const connection of connections) {
      const platform = connection.platform as BlogPlatform
      try {
        const client = getBlogClient(platform)
        if (!client) {
          results[platform] = { success: false, error: `No client available for ${platform}` }
          continue
        }

        let credential = ''
        if (connection.api_key_encrypted) {
          credential = await decryptToken(connection.api_key_encrypted)
        } else if (connection.access_token_encrypted) {
          credential = await decryptToken(connection.access_token_encrypted)
        }

        if (!credential) {
          results[platform] = { success: false, error: 'No valid credentials found' }
          continue
        }

        const siteUrl = connection.site_url || ''

        const publishResult = await client.publishPost(siteUrl, credential, {
          title: post.title,
          content: post.content,
          slug: post.slug || undefined,
          tags: post.tags || [],
          coverImageUrl: post.cover_image_url || undefined,
          excerpt: post.excerpt || undefined,
          status: 'publish',
        })

        if (publishResult.success && publishResult.url) {
          results[platform] = { success: true, url: publishResult.url }
          publishedUrls[platform] = publishResult.url
        } else {
          results[platform] = { success: false, error: publishResult.error || 'Unknown publish error' }
        }
      } catch (err) {
        results[platform] = { success: false, error: (err as Error).message }
      }
    }

    const allSucceeded = Object.values(results).every(r => r.success)
    const anySucceeded = Object.values(results).some(r => r.success)
    const newStatus = allSucceeded ? 'published' : anySucceeded ? 'published' : 'failed'
    const errorMessages = Object.entries(results)
      .filter(([, r]) => !r.success)
      .map(([p, r]) => `${p}: ${r.error}`)

    await admin.from('blog_posts').update({
      status: newStatus,
      published_urls: publishedUrls,
      published_at: anySucceeded ? new Date().toISOString() : null,
      error_message: errorMessages.length > 0 ? errorMessages.join('; ') : null,
      updated_at: new Date().toISOString(),
    }).eq('id', postId)

    return NextResponse.json({
      success: anySucceeded,
      results,
      publishedUrls,
      status: newStatus,
    })
  } catch (err) {
    console.error('[Blog Publish] Error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
