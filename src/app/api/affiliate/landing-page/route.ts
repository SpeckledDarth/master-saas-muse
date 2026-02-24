import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'partner'
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: page } = await admin
      .from('affiliate_landing_pages')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .maybeSingle()

    const { data: link } = await admin
      .from('referral_links')
      .select('ref_code')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      page: page || null,
      ref_code: link?.ref_code || null,
    })
  } catch (err) {
    console.error('Landing page GET error:', err)
    return NextResponse.json({ error: 'Failed to load landing page' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('affiliate_landing_pages')
      .select('id')
      .eq('affiliate_user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Landing page already exists. Use PATCH to update.' }, { status: 409 })
    }

    const { data: profile } = await admin
      .from('affiliate_profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle()

    const displayName = profile?.display_name || user.email?.split('@')[0] || 'partner'
    let baseSlug = generateSlug(body.slug || displayName)

    let slug = baseSlug
    let attempt = 0
    while (true) {
      const { data: slugExists } = await admin
        .from('affiliate_landing_pages')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (!slugExists) break
      attempt++
      slug = `${baseSlug}-${attempt}`
    }

    const insertData: Record<string, any> = {
      affiliate_user_id: user.id,
      slug,
      headline: body.headline || `Partner with ${displayName}`,
      bio: body.bio || '',
      photo_url: body.photo_url || '',
      custom_cta: body.custom_cta || 'Get Started',
      theme_color: body.theme_color || '#6366f1',
      is_active: true,
    }

    try {
      const { data: page, error } = await admin
        .from('affiliate_landing_pages')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ page })
    } catch (insertErr: any) {
      if (insertErr?.code === '42703') {
        const { photo_url, custom_cta, theme_color, ...minimalData } = insertData
        const { data: page, error } = await admin
          .from('affiliate_landing_pages')
          .insert(minimalData)
          .select()
          .single()

        if (error) throw error
        return NextResponse.json({ page })
      }
      throw insertErr
    }
  } catch (err) {
    console.error('Landing page POST error:', err)
    return NextResponse.json({ error: 'Failed to create landing page' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const admin = createAdminClient()

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (body.headline !== undefined) updateData.headline = body.headline
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.photo_url !== undefined) updateData.photo_url = body.photo_url
    if (body.custom_cta !== undefined) updateData.custom_cta = body.custom_cta
    if (body.theme_color !== undefined) updateData.theme_color = body.theme_color
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    try {
      const { data: page, error } = await admin
        .from('affiliate_landing_pages')
        .update(updateData)
        .eq('affiliate_user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ page })
    } catch (updateErr: any) {
      if (updateErr?.code === '42703') {
        const { photo_url, custom_cta, theme_color, ...minimalUpdate } = updateData
        const { data: page, error } = await admin
          .from('affiliate_landing_pages')
          .update(minimalUpdate)
          .eq('affiliate_user_id', user.id)
          .select()
          .single()

        if (error) throw error
        return NextResponse.json({ page })
      }
      throw updateErr
    }
  } catch (err) {
    console.error('Landing page PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update landing page' }, { status: 500 })
  }
}
