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

export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoff = thirtyDaysAgo.toISOString()

  const safeFetch = async (queryFn: () => PromiseLike<{ data: any; error: any }>) => {
    try {
      const r = await queryFn()
      if (r.error?.code === '42P01' || r.error?.message?.includes('does not exist')) return { data: [] }
      return { data: r.data || [] }
    } catch {
      return { data: [] }
    }
  }

  const [blogRes, socialRes] = await Promise.all([
    safeFetch(() =>
      admin.from('blog_posts')
        .select('id, title, status, created_at')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .lte('created_at', cutoff)
    ),
    safeFetch(() =>
      admin.from('social_posts')
        .select('id, content, platform, status, created_at')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .lte('created_at', cutoff)
    ),
  ])

  const now = new Date()
  const staleDrafts: Array<{
    id: string
    title: string
    type: 'blog' | 'social'
    platform?: string
    createdAt: string
    daysOld: number
  }> = []

  for (const bp of (blogRes.data as any[])) {
    const created = new Date(bp.created_at)
    const daysOld = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    staleDrafts.push({
      id: bp.id,
      title: bp.title || 'Untitled',
      type: 'blog',
      createdAt: bp.created_at,
      daysOld,
    })
  }

  for (const sp of (socialRes.data as any[])) {
    const created = new Date(sp.created_at)
    const daysOld = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    staleDrafts.push({
      id: sp.id,
      title: (sp.content || '').slice(0, 80) || 'Untitled post',
      type: 'social',
      platform: sp.platform,
      createdAt: sp.created_at,
      daysOld,
    })
  }

  staleDrafts.sort((a, b) => b.daysOld - a.daysOld)

  return NextResponse.json({ staleDrafts })
}
