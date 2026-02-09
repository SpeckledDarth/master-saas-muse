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
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('posting_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          preferences: null,
          note: 'Posting preferences table not yet created. Run the posting_preferences migration.'
        })
      }
      if (error.code === 'PGRST116') {
        return NextResponse.json({ preferences: null })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error('Posting preferences GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch posting preferences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    frequency?: string
    require_approval?: boolean
    auto_hashtags?: boolean
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    frequency = 'Once daily',
    require_approval = true,
    auto_hashtags = true,
  } = body

  if (frequency && typeof frequency !== 'string') {
    return NextResponse.json({ error: 'Frequency must be a string' }, { status: 400 })
  }

  try {
    const admin = getSupabaseAdmin()

    const { data: existing } = await admin
      .from('posting_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const prefsData = {
      user_id: user.id,
      frequency,
      require_approval,
      auto_hashtags,
    }

    let result
    if (existing) {
      const { data, error } = await admin
        .from('posting_preferences')
        .update(prefsData)
        .eq('user_id', user.id)
        .select('*')
        .single()
      result = { data, error }
    } else {
      const { data, error } = await admin
        .from('posting_preferences')
        .insert(prefsData)
        .select('*')
        .single()
      result = { data, error }
    }

    if (result.error) {
      if (result.error.code === '42P01' || result.error.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Posting preferences table not yet created. Run the posting_preferences migration.'
        }, { status: 500 })
      }
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: result.data })
  } catch (error) {
    console.error('Posting preferences POST error:', error)
    return NextResponse.json({ error: 'Failed to save posting preferences' }, { status: 500 })
  }
}
