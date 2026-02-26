import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ preference: null })
    }

    const { data } = await supabase
      .from('user_profiles')
      .select('theme_preference')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ preference: data?.theme_preference || null })
  } catch {
    return NextResponse.json({ preference: null })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { preference } = await request.json()
    if (!['light', 'dark', 'system'].includes(preference)) {
      return NextResponse.json({ error: 'Invalid preference' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ theme_preference: preference })
      .eq('id', user.id)

    if (error) {
      if (error.code === '42703') {
        return NextResponse.json({ preference, saved: false, reason: 'column_missing' })
      }
      throw error
    }

    return NextResponse.json({ preference, saved: true })
  } catch (err) {
    console.error('Theme preference save error:', err)
    return NextResponse.json({ error: 'Failed to save preference' }, { status: 500 })
  }
}
