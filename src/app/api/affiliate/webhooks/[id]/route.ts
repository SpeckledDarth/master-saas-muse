import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { WEBHOOK_EVENTS } from '@/lib/affiliate/webhooks'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: webhook } = await admin
      .from('affiliate_webhooks')
      .select('id, affiliate_user_id')
      .eq('id', id)
      .eq('affiliate_user_id', user.id)
      .single()

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    await admin
      .from('affiliate_webhook_deliveries')
      .delete()
      .eq('webhook_id', id)

    const { error } = await admin
      .from('affiliate_webhooks')
      .delete()
      .eq('id', id)
      .eq('affiliate_user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Webhook DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const admin = createAdminClient()

    const { data: webhook } = await admin
      .from('affiliate_webhooks')
      .select('id, affiliate_user_id')
      .eq('id', id)
      .eq('affiliate_user_id', user.id)
      .single()

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (body.url !== undefined) {
      try {
        new URL(body.url)
        updateData.url = body.url
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
      }
    }

    if (body.events !== undefined && Array.isArray(body.events)) {
      updateData.events = body.events.filter((e: string) => WEBHOOK_EVENTS.includes(e as any))
    }

    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active
      if (body.is_active) {
        updateData.failure_count = 0
      }
    }

    const { data: updated, error } = await admin
      .from('affiliate_webhooks')
      .update(updateData)
      .eq('id', id)
      .select('id, affiliate_user_id, url, events, is_active, last_triggered_at, failure_count, created_at, updated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ webhook: updated })
  } catch (err) {
    console.error('Webhook PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 })
  }
}
