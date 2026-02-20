import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

const safeFetch = async (queryFn: () => PromiseLike<{ data: any; error: any }>) => {
  try { const r = await queryFn(); if (r.error?.code === '42P01' || r.error?.message?.includes('does not exist')) return { data: [] }; return { data: r.data || [] } } catch { return { data: [] } }
}

const AI_MINUTES_PER_POST = 5
const MANUAL_MINUTES_PER_POST = 30

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdmin()

    const { data: orgData } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
    const settings = (orgData?.settings || {}) as any
    const hourlyRate = settings.socialModule?.hourlyRate || 50

    const postsRes = await safeFetch(() => admin.from('social_posts').select('id, ai_generated').eq('user_id', user.id))
    const posts: any[] = postsRes.data

    const totalPosts = posts.length
    const aiPosts = posts.filter(p => p.ai_generated).length
    const manualPosts = totalPosts - aiPosts

    const ratePerMinute = hourlyRate / 60
    const avgCostAi = Math.round((AI_MINUTES_PER_POST * ratePerMinute) * 100) / 100
    const avgCostManual = Math.round((MANUAL_MINUTES_PER_POST * ratePerMinute) * 100) / 100

    const totalCostIfAllManual = totalPosts * avgCostManual
    const actualCost = (aiPosts * avgCostAi) + (manualPosts * avgCostManual)
    const totalSaved = Math.round((totalCostIfAllManual - actualCost) * 100) / 100
    const savingsPercent = totalCostIfAllManual > 0 ? Math.round((totalSaved / totalCostIfAllManual) * 100) : 0

    return NextResponse.json({
      hourlyRate,
      totalPosts,
      aiPosts,
      manualPosts,
      avgCostAi,
      avgCostManual,
      totalSaved,
      savingsPercent,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to calculate cost per post' }, { status: 500 })
  }
}
