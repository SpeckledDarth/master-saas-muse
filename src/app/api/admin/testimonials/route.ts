import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function verifyAdminWithOrg(supabase: any, adminClient: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: roleData } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (roleData?.role !== 'admin') return null

  const { data: orgMember } = await adminClient
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  return { user, organizationId: orgMember?.organization_id || null }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const result = await verifyAdminWithOrg(supabase, adminClient)
    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = adminClient
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (result.organizationId) {
      query = query.eq('organization_id', result.organizationId)
    }

    const { data: testimonials, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ testimonials: testimonials || [] })
  } catch (error) {
    console.error('Testimonials fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const result = await verifyAdminWithOrg(supabase, adminClient)
    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, role, company, quote, avatar_url, company_logo_url, rating, status, featured } = body

    if (!name || !quote) {
      return NextResponse.json({ error: 'Name and quote are required' }, { status: 400 })
    }

    const { data: testimonial, error } = await adminClient
      .from('testimonials')
      .insert({
        organization_id: result.organizationId,
        name: name.trim(),
        role: role?.trim() || '',
        company: company?.trim() || '',
        quote: quote.trim(),
        avatar_url: avatar_url || null,
        company_logo_url: company_logo_url || null,
        rating: rating || null,
        status: status || 'approved',
        featured: featured || false,
        source: 'admin',
      })
      .select()
      .single()

    if (error) {
      console.error('Testimonial create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ testimonial })
  } catch (error) {
    console.error('Testimonial create error:', error)
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const result = await verifyAdminWithOrg(supabase, adminClient)
    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Testimonial ID required' }, { status: 400 })
    }

    const allowedFields = ['name', 'role', 'company', 'quote', 'avatar_url', 'company_logo_url', 'rating', 'status', 'featured', 'display_order']
    const sanitized: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const key of allowedFields) {
      if (key in updates) {
        sanitized[key] = updates[key]
      }
    }

    let query = adminClient
      .from('testimonials')
      .update(sanitized)
      .eq('id', id)

    if (result.organizationId) {
      query = query.eq('organization_id', result.organizationId)
    }

    const { data: testimonial, error } = await query.select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ testimonial })
  } catch (error) {
    console.error('Testimonial update error:', error)
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const result = await verifyAdminWithOrg(supabase, adminClient)
    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Testimonial ID required' }, { status: 400 })
    }

    let query = adminClient
      .from('testimonials')
      .delete()
      .eq('id', id)

    if (result.organizationId) {
      query = query.eq('organization_id', result.organizationId)
    }

    const { error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Testimonial delete error:', error)
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 })
  }
}
