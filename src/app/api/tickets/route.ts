import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    let query = admin
      .from('tickets')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ tickets: [], total: 0, note: 'Table not created yet' })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tickets: data || [], total: count || 0 })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ tickets: [], total: 0, note: 'Table not created yet' })
    }
    console.error('Tickets GET error:', err)
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const body = await request.json()
    const { subject, description, priority, category } = body

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }

    const insertFields: Record<string, any> = {
      user_id: user.id,
      subject,
      description: description || null,
      priority: priority || 'medium',
      category: category || null,
      status: 'open',
    }

    const { data, error } = await admin
      .from('tickets')
      .insert(insertFields)
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Tickets table not created yet' }, { status: 503 })
      if (error.message?.includes('column')) {
        const { data: retryData, error: retryErr } = await admin
          .from('tickets')
          .insert({ user_id: user.id, subject, status: 'open', priority: 'medium' })
          .select()
          .single()
        if (retryErr) return NextResponse.json({ error: retryErr.message }, { status: 500 })
        return NextResponse.json({ ticket: retryData })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ticket: data })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Tickets table not created yet' }, { status: 503 })
    }
    console.error('Tickets POST error:', err)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
