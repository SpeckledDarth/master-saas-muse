import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin(adminClient: any, userId: string): Promise<boolean> {
  const { data: userRole } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
  if (userRole?.role === 'admin') return true

  const { data: teamMember } = await adminClient
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', 1)
    .maybeSingle()
  return teamMember?.role === 'owner' || teamMember?.role === 'manager'
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    if (!(await requireAdmin(adminClient, user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const contractType = searchParams.get('contract_type')
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = adminClient
      .from('contracts')
      .select('*', { count: 'exact' })

    if (status) query = query.eq('status', status)
    if (contractType) query = query.eq('contract_type', contractType)
    if (userId) query = query.eq('user_id', userId)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      if (error.message?.includes('Could not find') || error.code === '42P01') {
        return NextResponse.json({ contracts: [], total: 0 })
      }
      throw error
    }

    return NextResponse.json({ contracts: data || [], total: count || 0 })
  } catch (error: any) {
    console.error('[Admin Contracts GET]', error)
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
    if (!(await requireAdmin(adminClient, user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { title, body: contractBody, contract_type, effective_date, user_id, expiry_date } = body

    if (!title || !contractBody || !user_id) {
      return NextResponse.json({ error: 'title, body, and user_id are required' }, { status: 400 })
    }

    const insertData: any = {
      user_id,
      title,
      body: contractBody,
      contract_type: contract_type || 'affiliate_terms',
      effective_date: effective_date || null,
      expiry_date: expiry_date || null,
    }

    const { data, error } = await adminClient
      .from('contracts')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      if (error.message?.includes('Could not find') || error.code === '42P01') {
        return NextResponse.json({ error: 'Contracts table not yet created. Run migration 011.' }, { status: 503 })
      }
      throw error
    }

    return NextResponse.json({ contract: data }, { status: 201 })
  } catch (error: any) {
    console.error('[Admin Contracts POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
