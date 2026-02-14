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

export async function GET() {
  let user
  try {
    user = await getAuthenticatedUser()
  } catch {
    return NextResponse.json({ error: 'Auth error' }, { status: 401 })
  }
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('brand_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          preferences: null,
          note: 'Brand preferences table not yet created. Run migrations/extensions/001_passivepost_tables.sql'
        })
      }
      if (error.code === 'PGRST116') {
        return NextResponse.json({ preferences: null })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error('Brand preferences GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch brand preferences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let user
  try {
    user = await getAuthenticatedUser()
  } catch {
    return NextResponse.json({ error: 'Auth error' }, { status: 401 })
  }
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    tone?: string
    niche?: string
    location?: string
    sample_urls?: string[]
    target_audience?: string
    posting_goals?: string
    preferred_platforms?: string[]
    post_frequency?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    tone = 'professional',
    niche = 'other',
    location,
    sample_urls = [],
    target_audience,
    posting_goals,
    preferred_platforms = [],
    post_frequency = 'daily',
  } = body

  if (tone && typeof tone !== 'string') {
    return NextResponse.json({ error: 'Tone must be a string' }, { status: 400 })
  }
  if (niche && typeof niche !== 'string') {
    return NextResponse.json({ error: 'Niche must be a string' }, { status: 400 })
  }

  try {
    const admin = getSupabaseAdmin()

    const { data: existing } = await admin
      .from('brand_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const prefsData = {
      user_id: user.id,
      tone,
      niche,
      location: location || null,
      sample_urls,
      target_audience: target_audience || null,
      posting_goals: posting_goals || null,
      preferred_platforms,
      post_frequency,
    }

    let result
    if (existing) {
      const { data, error } = await admin
        .from('brand_preferences')
        .update(prefsData)
        .eq('user_id', user.id)
        .select('*')
        .single()
      result = { data, error }
    } else {
      const { data, error } = await admin
        .from('brand_preferences')
        .insert(prefsData)
        .select('*')
        .single()
      result = { data, error }
    }

    if (result.error) {
      if (result.error.code === '42P01' || result.error.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Brand preferences table not yet created. Run migrations/extensions/001_passivepost_tables.sql'
        }, { status: 500 })
      }
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: result.data })
  } catch (error) {
    console.error('Brand preferences POST error:', error)
    return NextResponse.json({ error: 'Failed to save brand preferences' }, { status: 500 })
  }
}
