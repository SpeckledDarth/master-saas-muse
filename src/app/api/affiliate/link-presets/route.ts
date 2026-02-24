import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const admin = createAdminClient()

    const { data: presets } = await admin
      .from('affiliate_link_presets')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ presets: presets || [] })
  } catch (err: any) {
    if (err?.code === '42P01') {
      return NextResponse.json({ presets: [] })
    }
    console.error('Link presets GET error:', err)
    return NextResponse.json({ error: 'Failed to load presets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json()
    const admin = createAdminClient()

    if (body.action === 'delete' && body.id) {
      const { error } = await admin
        .from('affiliate_link_presets')
        .delete()
        .eq('id', body.id)
        .eq('affiliate_user_id', user.id)

      if (error) {
        return NextResponse.json({ error: 'Failed to delete preset' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (!body.name) {
      return NextResponse.json({ error: 'Preset name is required' }, { status: 400 })
    }

    const { error } = await admin
      .from('affiliate_link_presets')
      .insert({
        affiliate_user_id: user.id,
        name: body.name,
        page_path: body.page_path || '/',
        source_tag: body.source_tag || null,
        include_utm: body.include_utm !== false,
      })

    if (error) {
      console.error('Preset insert error:', error)
      return NextResponse.json({ error: 'Failed to save preset' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Link presets POST error:', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
