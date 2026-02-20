import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'shall', 'it', 'its', 'this',
  'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
  'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'what',
  'which', 'who', 'whom', 'how', 'when', 'where', 'why', 'not', 'no',
  'so', 'if', 'then', 'than', 'too', 'very', 'just', 'about', 'up',
  'out', 'all', 'also', 'as', 'into', 'more', 'some', 'such', 'only',
  'other', 'new', 'like', 'get', 'got', 'go', 'going', 'make', 'made',
  'know', 'think', 'see', 'come', 'want', 'use', 'here', 'there', 'now',
  'way', 'well', 'even', 'back', 'any', 'good', 'give', 'most', 'after',
  'over', 'much', 'still', 'own', 'one', 'two', 'three', 'don', 't', 's',
  're', 've', 'll', 'amp', 'http', 'https', 'www', 'com',
])

function extractKeywords(text: string): Set<string> {
  if (!text) return new Set()
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
  return new Set(words)
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0
  let intersection = 0
  for (const item of setA) {
    if (setB.has(item)) intersection++
  }
  const union = setA.size + setB.size - intersection
  if (union === 0) return 0
  return intersection / union
}

export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  const safeFetch = async (queryFn: () => PromiseLike<{ data: any; error: any }>) => {
    try {
      const result = await queryFn()
      if (result.error?.code === '42P01' || result.error?.message?.includes('does not exist')) {
        return { data: [] }
      }
      return { data: result.data || [] }
    } catch {
      return { data: [] }
    }
  }

  try {
    const postsRes = await safeFetch(() =>
      admin.from('blog_posts')
        .select('id, title, content, tags')
        .eq('user_id', user.id)
    )

    const posts: any[] = postsRes.data || []

    if (posts.length < 2) {
      return NextResponse.json({ pairs: [] })
    }

    const processed = posts.map(post => ({
      id: post.id,
      title: post.title || '',
      tags: new Set<string>((Array.isArray(post.tags) ? post.tags : []).map((t: string) => t.toLowerCase().trim())),
      titleKeywords: extractKeywords(post.title || ''),
      contentKeywords: extractKeywords((post.content || '').slice(0, 5000)),
    }))

    const pairs: Array<{
      article1: { id: string; title: string }
      article2: { id: string; title: string }
      overlapScore: number
      suggestion: string
    }> = []

    for (let i = 0; i < processed.length; i++) {
      for (let j = i + 1; j < processed.length; j++) {
        const a = processed[i]
        const b = processed[j]

        const tagOverlap = jaccardSimilarity(a.tags, b.tags)
        const titleOverlap = jaccardSimilarity(a.titleKeywords, b.titleKeywords)
        const contentOverlap = jaccardSimilarity(a.contentKeywords, b.contentKeywords)

        const overlapScore = (tagOverlap * 0.3) + (titleOverlap * 0.3) + (contentOverlap * 0.4)

        if (overlapScore > 0.6) {
          const scorePercent = Math.round(overlapScore * 100)
          let suggestion: string

          if (overlapScore > 0.8) {
            suggestion = 'Consider merging these articles into a single comprehensive piece'
          } else if (tagOverlap > 0.7) {
            suggestion = `Differentiate by focusing "${a.title}" on a unique sub-topic`
          } else {
            suggestion = `Differentiate by giving each article a distinct angle or audience`
          }

          pairs.push({
            article1: { id: a.id, title: a.title },
            article2: { id: b.id, title: b.title },
            overlapScore: scorePercent,
            suggestion,
          })
        }
      }
    }

    pairs.sort((a, b) => b.overlapScore - a.overlapScore)

    return NextResponse.json({ pairs: pairs.slice(0, 20) })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to detect content cannibalization: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
