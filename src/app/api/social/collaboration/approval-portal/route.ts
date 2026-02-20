import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

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

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { postIds } = body as { postIds?: string[] }

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: 'postIds array is required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: orgData } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
    const settings = (orgData?.settings || {}) as any

    const approvalTokens = settings.socialModule?.approvalTokens || []
    approvalTokens.push({
      token,
      postIds,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt,
    })

    const updatedSettings = {
      ...settings,
      socialModule: { ...(settings.socialModule || {}), approvalTokens }
    }

    const { error } = await admin.from('organization_settings').update({ settings: updatedSettings }).eq('app_id', 'default')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      token,
      url: `/approve/${token}`,
      expiresAt,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create approval link' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) return NextResponse.json({ error: 'Token query parameter is required' }, { status: 400 })

    const admin = getSupabaseAdmin()

    const { data: orgData } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
    const settings = (orgData?.settings || {}) as any
    const approvalTokens: any[] = settings.socialModule?.approvalTokens || []

    const tokenData = approvalTokens.find(t => t.token === token)
    if (!tokenData) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })

    if (new Date(tokenData.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 410 })
    }

    const postsRes = await safeFetch(() =>
      admin.from('social_posts').select('id, platform, content, status, scheduled_at').in('id', tokenData.postIds)
    )

    const posts = (postsRes.data as any[]).map(p => ({
      id: p.id,
      platform: p.platform,
      content: p.content,
      status: p.status,
      scheduledAt: p.scheduled_at,
    }))

    return NextResponse.json({ posts, expiresAt: tokenData.expiresAt })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to retrieve approval data' }, { status: 500 })
  }
}
