import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const mine = searchParams.get('mine')
    const tag = searchParams.get('tag')

    if (mine === 'true') {
      const { data: caseStudies, error } = await admin
        .from('case_studies')
        .select('*')
        .eq('affiliate_user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205') {
          return NextResponse.json({ caseStudies: [] })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ caseStudies: caseStudies || [] })
    }

    let query = admin
      .from('case_studies')
      .select('id, headline, summary, key_metric, key_metric_label, customer_quote, customer_name, customer_role, affiliate_user_id, testimonial_id, featured_image_url, tags, featured, created_at')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data: caseStudies, error } = await query

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({ caseStudies: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const affiliateIds = [...new Set((caseStudies || []).filter((cs: any) => cs.affiliate_user_id).map((cs: any) => cs.affiliate_user_id))]
    const testimonialIds = [...new Set((caseStudies || []).filter((cs: any) => cs.testimonial_id).map((cs: any) => cs.testimonial_id))]

    let profilesMap: Record<string, any> = {}
    let testimonialsMap: Record<string, any> = {}

    if (affiliateIds.length > 0) {
      const { data: profiles } = await admin
        .from('affiliate_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', affiliateIds)

      for (const p of profiles || []) {
        profilesMap[p.user_id] = p
      }

      const { data: tiers } = await admin
        .from('affiliate_tiers')
        .select('user_id, tier_name, tier_level')
        .in('user_id', affiliateIds)

      for (const t of tiers || []) {
        if (profilesMap[t.user_id]) {
          profilesMap[t.user_id].tier_name = t.tier_name
          profilesMap[t.user_id].tier_level = t.tier_level
        }
      }
    }

    if (testimonialIds.length > 0) {
      const { data: testimonials } = await admin
        .from('testimonials')
        .select('id, name, quote, rating')
        .in('id', testimonialIds)

      for (const t of testimonials || []) {
        testimonialsMap[t.id] = t
      }
    }

    const enriched = (caseStudies || []).map((cs: any) => ({
      ...cs,
      affiliate_profile: profilesMap[cs.affiliate_user_id] || null,
      testimonial: testimonialsMap[cs.testimonial_id] || null,
    }))

    return NextResponse.json({ caseStudies: enriched })
  } catch (error: any) {
    console.error('Affiliate case studies GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch case studies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const body = await request.json()

    const {
      headline,
      summary,
      key_metric,
      key_metric_label,
      customer_quote,
    } = body

    if (!headline || !summary) {
      return NextResponse.json({ error: 'Headline and summary are required' }, { status: 400 })
    }

    const { data: profile } = await admin
      .from('affiliate_profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: caseStudy, error } = await admin
      .from('case_studies')
      .insert({
        headline: headline.trim(),
        summary: summary.trim(),
        key_metric: key_metric || null,
        key_metric_label: key_metric_label || null,
        customer_quote: customer_quote || null,
        customer_name: profile?.display_name || null,
        affiliate_user_id: user.id,
        tags: body.tags || [],
        status: 'pending_review',
        source: 'affiliate',
      })
      .select()
      .single()

    if (error) {
      console.error('Case study submission error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ caseStudy })
  } catch (error: any) {
    console.error('Affiliate case study POST error:', error)
    return NextResponse.json({ error: 'Failed to submit case study' }, { status: 500 })
  }
}
