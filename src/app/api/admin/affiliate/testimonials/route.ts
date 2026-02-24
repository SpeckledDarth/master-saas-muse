import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/affiliate/audit'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: teamMember } = await admin
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) return null
  return user
}

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: testimonials, error } = await admin
      .from('affiliate_testimonials')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        return NextResponse.json({ testimonials: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ testimonials: testimonials || [] })
  } catch (err) {
    console.error('Admin testimonials GET error:', err)
    return NextResponse.json({ error: 'Failed to load testimonials' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, quote, earnings_display, tier_name, avatar_url, is_featured, is_active, sort_order } = body

    if (!name || !quote) {
      return NextResponse.json({ error: 'Name and quote are required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const fullRow: Record<string, any> = {
      name,
      quote,
      earnings_display: earnings_display || null,
      tier_name: tier_name || null,
      avatar_url: avatar_url || null,
      is_featured: is_featured || false,
      is_active: is_active !== false,
      source: 'manual',
      sort_order: sort_order || 0,
    }

    const { data: testimonial, error } = await admin
      .from('affiliate_testimonials')
      .insert(fullRow)
      .select()
      .single()

    if (error) {
      if (error.code === '42703') {
        const minRow = { name, quote, source: 'manual' }
        const { data: minTest, error: minErr } = await admin
          .from('affiliate_testimonials')
          .insert(minRow)
          .select()
          .single()
        if (minErr) return NextResponse.json({ error: minErr.message }, { status: 500 })
        await logAuditEvent({
          admin_user_id: user.id,
          admin_email: user.email || undefined,
          action: 'create',
          entity_type: 'testimonial',
          entity_id: minTest?.id,
          entity_name: name,
        })
        return NextResponse.json({ testimonial: minTest })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logAuditEvent({
      admin_user_id: user.id,
      admin_email: user.email || undefined,
      action: 'create',
      entity_type: 'testimonial',
      entity_id: testimonial?.id,
      entity_name: name,
    })

    return NextResponse.json({ testimonial })
  } catch (err) {
    console.error('Admin testimonials POST error:', err)
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Testimonial ID is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: testimonial, error } = await admin
      .from('affiliate_testimonials')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAuditEvent({
      admin_user_id: user.id,
      admin_email: user.email || undefined,
      action: 'update',
      entity_type: 'testimonial',
      entity_id: id,
      details: updates,
    })

    return NextResponse.json({ testimonial })
  } catch (err) {
    console.error('Admin testimonials PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Testimonial ID is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from('affiliate_testimonials')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAuditEvent({
      admin_user_id: user.id,
      admin_email: user.email || undefined,
      action: 'delete',
      entity_type: 'testimonial',
      entity_id: id,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin testimonials DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 })
  }
}
