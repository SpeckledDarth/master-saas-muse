import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('affiliate_assets')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ assets: [] })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assets: data || [] })
  } catch (err) {
    console.error('Affiliate assets GET error:', err)
    return NextResponse.json({ error: 'Failed to load assets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { title, description, asset_type, content, file_url, file_name, sort_order } = body

    if (!title || !asset_type) {
      return NextResponse.json({ error: 'Title and asset type required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('affiliate_assets')
      .insert({ title, description, asset_type, content, file_url, file_name, sort_order: sort_order || 0 })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ asset: data })
  } catch (err) {
    console.error('Affiliate assets POST error:', err)
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })

    updates.updated_at = new Date().toISOString()

    const { error } = await admin.from('affiliate_assets').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Affiliate assets PUT error:', err)
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })

    const { error } = await admin.from('affiliate_assets').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Affiliate assets DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}
