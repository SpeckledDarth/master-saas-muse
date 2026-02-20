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

const DEFAULT_ROI_VALUES = { leadValue: 50, clickValue: 2, shareValue: 5, commentValue: 3, likeValue: 1 }

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdmin()

    const { data: orgData } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
    const settings = (orgData?.settings || {}) as any
    const roiValues = settings.socialModule?.roiValues || DEFAULT_ROI_VALUES

    const postsRes = await safeFetch(() => admin.from('social_posts').select('id, likes_count, comments_count, shares_count, clicks_count').eq('user_id', user.id))
    const posts: any[] = postsRes.data

    let totalLikes = 0, totalComments = 0, totalShares = 0, totalClicks = 0
    for (const p of posts) {
      totalLikes += (p.likes_count || 0)
      totalComments += (p.comments_count || 0)
      totalShares += (p.shares_count || 0)
      totalClicks += (p.clicks_count || 0)
    }

    const breakdown = {
      likes: { count: totalLikes, value: totalLikes * roiValues.likeValue },
      comments: { count: totalComments, value: totalComments * roiValues.commentValue },
      shares: { count: totalShares, value: totalShares * roiValues.shareValue },
      clicks: { count: totalClicks, value: totalClicks * roiValues.clickValue },
    }

    const totalROI = breakdown.likes.value + breakdown.comments.value + breakdown.shares.value + breakdown.clicks.value

    return NextResponse.json({ settings: roiValues, totalROI, breakdown })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to calculate ROI' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { leadValue, clickValue, shareValue, commentValue, likeValue } = body

    const admin = getSupabaseAdmin()
    const { data: orgData } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
    const settings = (orgData?.settings || {}) as any

    const currentRoi = settings.socialModule?.roiValues || DEFAULT_ROI_VALUES
    const updatedRoi = {
      leadValue: leadValue ?? currentRoi.leadValue,
      clickValue: clickValue ?? currentRoi.clickValue,
      shareValue: shareValue ?? currentRoi.shareValue,
      commentValue: commentValue ?? currentRoi.commentValue,
      likeValue: likeValue ?? currentRoi.likeValue,
    }

    const updatedSettings = {
      ...settings,
      socialModule: { ...(settings.socialModule || {}), roiValues: updatedRoi }
    }

    const { error } = await admin.from('organization_settings').update({ settings: updatedSettings }).eq('app_id', 'default')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ settings: updatedRoi, success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update ROI settings' }, { status: 500 })
  }
}
