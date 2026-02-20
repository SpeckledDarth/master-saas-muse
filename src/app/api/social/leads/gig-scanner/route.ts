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

const safeFetch = async (queryFn: () => PromiseLike<{ data: any; error: any }>) => {
  try {
    const r = await queryFn()
    if (r.error?.code === '42P01' || r.error?.message?.includes('does not exist')) return { data: [] }
    return { data: r.data || [] }
  } catch {
    return { data: [] }
  }
}

export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  const brandRes = await safeFetch(() =>
    admin.from('brand_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
  )

  const brandData = Array.isArray(brandRes.data) ? brandRes.data[0] : brandRes.data
  const niche = brandData?.niche || brandData?.industry || 'general services'
  const location = brandData?.location || brandData?.city || 'your area'

  const keywords = [
    `need ${niche}`,
    `looking for ${niche}`,
    `hire ${niche}`,
    `anyone know a ${niche}`,
    `${niche} near me`,
    `${niche} in ${location}`,
  ]

  const postsRes = await safeFetch(() =>
    admin.from('social_posts')
      .select('id, content, platform, engagement_data, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
  )

  const signalPatterns = ['need', 'looking for', 'anyone know', 'recommend', 'hire']
  const matchedPosts = (postsRes.data as any[]).filter((post: any) => {
    const content = (post.content || '').toLowerCase()
    const engagementStr = JSON.stringify(post.engagement_data || {}).toLowerCase()
    return signalPatterns.some(pattern => content.includes(pattern) || engagementStr.includes(pattern))
  })

  const platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'nextdoor']
  const timeOffsets = ['12 minutes ago', '2 hours ago', '4 hours ago', '8 hours ago', '1 day ago']
  const nicheLabel = niche.charAt(0).toUpperCase() + niche.slice(1)

  const simulatedSnippets = [
    {
      keyword: `need ${niche}`,
      snippet: `Does anyone know a good ${niche}? We need someone ASAP for a project starting next week.`,
      source: 'Community Group Post',
    },
    {
      keyword: `looking for ${niche}`,
      snippet: `Looking for a reliable ${niche} in ${location}. Had a bad experience with our last one and need someone new.`,
      source: 'Neighborhood Thread',
    },
    {
      keyword: `hire ${niche}`,
      snippet: `Want to hire a ${niche} for ongoing work. Preferably someone local who can start this month.`,
      source: 'Direct Mention',
    },
    {
      keyword: `anyone know a ${niche}`,
      snippet: `Anyone know a good ${niche} around ${location}? Getting quotes for a big project and want recommendations.`,
      source: 'Comment Reply',
    },
    {
      keyword: `${niche} near me`,
      snippet: `Just moved to ${location} and searching for a ${niche} near me. Any suggestions from locals?`,
      source: 'Public Post',
    },
  ]

  const alerts = simulatedSnippets.map((sim, i) => ({
    id: `gig-alert-${i + 1}`,
    platform: platforms[i % platforms.length],
    matchedKeyword: sim.keyword,
    snippet: sim.snippet,
    source: sim.source,
    detectedAt: timeOffsets[i],
    status: i < 3 ? 'new' as const : 'dismissed' as const,
  }))

  for (const post of matchedPosts.slice(0, 2)) {
    alerts.push({
      id: `gig-post-${post.id}`,
      platform: post.platform || 'unknown',
      matchedKeyword: signalPatterns.find(p => (post.content || '').toLowerCase().includes(p)) || 'engagement signal',
      snippet: (post.content || '').slice(0, 200),
      source: 'Your Post Engagement',
      detectedAt: new Date(post.created_at).toLocaleDateString(),
      status: 'new' as const,
    })
  }

  return NextResponse.json({
    alerts,
    keywords,
    niche,
    location,
  })
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { alertId, action, customReply } = body

  if (!alertId || !['reply', 'dismiss'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request. Provide alertId and action (reply or dismiss).' }, { status: 400 })
  }

  return NextResponse.json({ success: true, action })
}
