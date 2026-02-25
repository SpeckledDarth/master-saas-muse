import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = adminClient
      .from('campaigns')
      .select('*', { count: 'exact' })
      .eq('created_by', user.id)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      if (error.message?.includes('Could not find') || error.code === '42P01') {
        return NextResponse.json({ campaigns: [], total: 0 })
      }
      throw error
    }

    return NextResponse.json({ campaigns: data || [], total: count || 0 })
  } catch (error: any) {
    console.error('[Campaigns GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const body = await request.json()

    const { name, description, utm_source, utm_medium, utm_campaign, utm_term, utm_content, start_date, end_date, budget_cents } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const insertData: any = {
      created_by: user.id,
      name,
      description: description || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_term: utm_term || null,
      utm_content: utm_content || null,
      start_date: start_date || null,
      end_date: end_date || null,
      budget_cents: budget_cents || null,
    }

    const { data, error } = await adminClient
      .from('campaigns')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      if (error.message?.includes('Could not find') || error.code === '42P01') {
        return NextResponse.json({ error: 'Campaigns table not yet created. Run migration 011.' }, { status: 503 })
      }
      throw error
    }

    return NextResponse.json({ campaign: data }, { status: 201 })
  } catch (error: any) {
    console.error('[Campaigns POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
