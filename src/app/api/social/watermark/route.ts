import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('organization_settings')
      .select('settings')
      .eq('app_id', 'default')
      .single()

    const settings = (data?.settings || {}) as any
    const watermark = settings.watermark || { enabled: false, text: 'Posted via PassivePost', position: 'bottom' }

    return NextResponse.json({ watermark })
  } catch (error) {
    return NextResponse.json({ watermark: { enabled: false, text: 'Posted via PassivePost', position: 'bottom' } })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { enabled, text, position } = body

    const { data: current } = await adminClient
      .from('organization_settings')
      .select('settings')
      .eq('app_id', 'default')
      .single()

    const settings = (current?.settings || {}) as any
    settings.watermark = {
      enabled: enabled ?? settings.watermark?.enabled ?? false,
      text: text?.trim() || settings.watermark?.text || 'Posted via PassivePost',
      position: position || settings.watermark?.position || 'bottom',
    }

    const { error } = await adminClient
      .from('organization_settings')
      .update({ settings })
      .eq('app_id', 'default')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ watermark: settings.watermark })
  } catch (error) {
    console.error('Watermark update error:', error)
    return NextResponse.json({ error: 'Failed to update watermark settings' }, { status: 500 })
  }
}
