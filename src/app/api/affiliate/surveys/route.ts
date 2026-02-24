import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: surveys, error } = await admin
      .from('affiliate_surveys')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        return NextResponse.json({ surveys: [], lastSurveyAt: null, canTakeSurvey: true })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let surveyIntervalDays = 90
    try {
      const { data: settings } = await admin
        .from('affiliate_program_settings')
        .select('survey_interval_days')
        .limit(1)
        .maybeSingle()
      if (settings?.survey_interval_days) {
        surveyIntervalDays = settings.survey_interval_days
      }
    } catch {}

    const lastSurvey = surveys && surveys.length > 0 ? surveys[0] : null
    const lastSurveyAt = lastSurvey?.created_at || null
    const canTakeSurvey = !lastSurveyAt ||
      (Date.now() - new Date(lastSurveyAt).getTime()) > surveyIntervalDays * 24 * 60 * 60 * 1000

    return NextResponse.json({
      surveys: surveys || [],
      lastSurveyAt,
      canTakeSurvey,
      surveyIntervalDays,
    })
  } catch (err) {
    console.error('Survey GET error:', err)
    return NextResponse.json({ error: 'Failed to load surveys' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { rating, feedback, can_use_as_testimonial } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const admin = createAdminClient()

    const fullRow: Record<string, any> = {
      affiliate_user_id: user.id,
      rating: Math.round(rating),
      feedback: feedback || null,
      can_use_as_testimonial: can_use_as_testimonial || false,
    }

    const { data: survey, error } = await admin
      .from('affiliate_surveys')
      .insert(fullRow)
      .select()
      .single()

    if (error) {
      if (error.code === '42703') {
        const minRow = {
          affiliate_user_id: user.id,
          rating: Math.round(rating),
        }
        const { data: minSurvey, error: minErr } = await admin
          .from('affiliate_surveys')
          .insert(minRow)
          .select()
          .single()

        if (minErr) return NextResponse.json({ error: minErr.message }, { status: 500 })
        return NextResponse.json({ survey: minSurvey })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (can_use_as_testimonial && feedback) {
      try {
        const { data: profile } = await admin
          .from('affiliate_profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .maybeSingle()

        const { data: link } = await admin
          .from('referral_links')
          .select('total_earnings_cents, current_tier_id')
          .eq('user_id', user.id)
          .maybeSingle()

        let tierName = null
        if (link?.current_tier_id) {
          const { data: tier } = await admin
            .from('affiliate_tiers')
            .select('name')
            .eq('id', link.current_tier_id)
            .maybeSingle()
          tierName = tier?.name || null
        }

        await admin.from('affiliate_testimonials').insert({
          affiliate_user_id: user.id,
          name: profile?.display_name || user.email?.split('@')[0] || 'Affiliate',
          quote: feedback,
          tier_name: tierName,
          source: 'survey',
          is_featured: false,
          is_active: false,
        })
      } catch {}
    }

    return NextResponse.json({ survey })
  } catch (err) {
    console.error('Survey POST error:', err)
    return NextResponse.json({ error: 'Failed to submit survey' }, { status: 500 })
  }
}
