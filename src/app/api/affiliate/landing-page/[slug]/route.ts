import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const admin = createAdminClient()

    const { data: page, error } = await admin
      .from('affiliate_landing_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const { data: link } = await admin
      .from('referral_links')
      .select('ref_code')
      .eq('user_id', page.affiliate_user_id)
      .maybeSingle()

    admin
      .from('affiliate_landing_pages')
      .update({ views: (page.views || 0) + 1 })
      .eq('id', page.id)
      .then(() => {})

    return NextResponse.json({
      page: {
        headline: page.headline,
        bio: page.bio,
        photo_url: page.photo_url,
        custom_cta: page.custom_cta,
        theme_color: page.theme_color,
        views: page.views,
        slug: page.slug,
      },
      ref_code: link?.ref_code || null,
    })
  } catch (err) {
    console.error('Public landing page GET error:', err)
    return NextResponse.json({ error: 'Failed to load page' }, { status: 500 })
  }
}
