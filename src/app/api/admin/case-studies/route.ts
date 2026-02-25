import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chatCompletion } from '@/lib/ai/provider'
import { defaultSettings } from '@/types/settings'
import type { AISettings } from '@/types/settings'

async function verifyAdmin(supabase: any, adminClient: any) {
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

async function getAISettings(adminClient: any): Promise<{ enabled: boolean; settings: AISettings }> {
  const { data } = await adminClient
    .from('organization_settings')
    .select('settings')
    .eq('app_id', 'default')
    .single()

  const features = data?.settings?.features || defaultSettings.features
  const ai = { ...defaultSettings.ai!, ...(data?.settings?.ai || {}) } as AISettings

  return {
    enabled: features.aiEnabled ?? false,
    settings: ai,
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const result = await verifyAdmin(supabase, adminClient)
    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = adminClient
      .from('case_studies')
      .select('*')
      .order('created_at', { ascending: false })

    if (result.organizationId) {
      query = query.eq('organization_id', result.organizationId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: caseStudies, error } = await query

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({ caseStudies: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ caseStudies: caseStudies || [] })
  } catch (error: any) {
    console.error('Admin case studies GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch case studies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const result = await verifyAdmin(supabase, adminClient)
    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (body.action === 'ai_draft' && body.affiliate_user_id) {
      return await handleAIDraft(adminClient, result, body.affiliate_user_id)
    }

    const {
      headline,
      summary,
      key_metric,
      key_metric_label,
      customer_quote,
      customer_name,
      customer_role,
      affiliate_user_id,
      testimonial_id,
      featured_image_url,
      tags,
      status: caseStatus,
    } = body

    if (!headline || !summary) {
      return NextResponse.json({ error: 'Headline and summary are required' }, { status: 400 })
    }

    const { data: caseStudy, error } = await adminClient
      .from('case_studies')
      .insert({
        organization_id: result.organizationId,
        headline: headline.trim(),
        summary: summary.trim(),
        key_metric: key_metric || null,
        key_metric_label: key_metric_label || null,
        customer_quote: customer_quote || null,
        customer_name: customer_name || null,
        customer_role: customer_role || null,
        affiliate_user_id: affiliate_user_id || null,
        testimonial_id: testimonial_id || null,
        featured_image_url: featured_image_url || null,
        tags: tags || [],
        status: caseStatus || 'published',
        source: 'admin',
      })
      .select()
      .single()

    if (error) {
      console.error('Case study create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ caseStudy })
  } catch (error: any) {
    console.error('Admin case study POST error:', error)
    return NextResponse.json({ error: 'Failed to create case study' }, { status: 500 })
  }
}

async function handleAIDraft(adminClient: any, result: any, affiliateUserId: string) {
  const aiConfig = await getAISettings(adminClient)
  if (!aiConfig.enabled) {
    return NextResponse.json({ error: 'AI is not enabled' }, { status: 400 })
  }

  const [commissionsResult, referralsResult, profileResult] = await Promise.all([
    adminClient
      .from('affiliate_commissions')
      .select('commission_amount_cents, status, created_at')
      .eq('affiliate_user_id', affiliateUserId),
    adminClient
      .from('affiliate_referrals')
      .select('id, status, created_at')
      .eq('affiliate_user_id', affiliateUserId),
    adminClient
      .from('affiliate_profiles')
      .select('display_name, bio')
      .eq('user_id', affiliateUserId)
      .maybeSingle(),
  ])

  const commissions = commissionsResult.data || []
  const referrals = referralsResult.data || []
  const profile = profileResult.data

  const totalEarnings = commissions.reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0) / 100
  const totalReferrals = referrals.length
  const convertedReferrals = referrals.filter((r: any) => r.status === 'converted' || r.status === 'active').length

  const prompt = `Write a compelling case study for an affiliate partner. Use this real data:
- Affiliate name: ${profile?.display_name || 'Partner'}
- Bio: ${profile?.bio || 'N/A'}
- Total earnings: $${totalEarnings.toFixed(2)}
- Total referrals: ${totalReferrals}
- Converted referrals: ${convertedReferrals}
- Active since: ${commissions.length > 0 ? commissions[commissions.length - 1]?.created_at?.split('T')[0] : 'N/A'}

Return a JSON object with these fields:
- headline: A compelling headline (max 80 chars)
- summary: A 2-3 paragraph case study narrative
- key_metric: The most impressive number (e.g., "$5,000+" or "150+")
- key_metric_label: Label for the metric (e.g., "Total Earnings" or "Referrals Made")
- customer_quote: A realistic testimonial quote the affiliate might say
- tags: Array of 2-3 relevant tags (e.g., ["top-earner", "growth-story"])

Return ONLY valid JSON, no markdown.`

  try {
    const aiResult = await chatCompletion(aiConfig.settings, [
      { role: 'user', content: prompt }
    ])

    let draft
    try {
      draft = JSON.parse(aiResult.content)
    } catch {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        draft = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 })
      }
    }

    return NextResponse.json({
      draft: {
        ...draft,
        affiliate_user_id: affiliateUserId,
        customer_name: profile?.display_name || 'Partner',
      },
      metrics: {
        totalEarnings,
        totalReferrals,
        convertedReferrals,
      },
    })
  } catch (aiError: any) {
    console.error('AI draft error:', aiError)
    return NextResponse.json({ error: aiError.message || 'AI generation failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const result = await verifyAdmin(supabase, adminClient)
    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Case study ID required' }, { status: 400 })
    }

    const allowedFields = [
      'headline', 'summary', 'key_metric', 'key_metric_label',
      'customer_quote', 'customer_name', 'customer_role',
      'affiliate_user_id', 'testimonial_id', 'featured_image_url',
      'tags', 'status', 'featured',
    ]
    const sanitized: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const key of allowedFields) {
      if (key in updates) {
        sanitized[key] = updates[key]
      }
    }

    let query = adminClient
      .from('case_studies')
      .update(sanitized)
      .eq('id', id)

    if (result.organizationId) {
      query = query.eq('organization_id', result.organizationId)
    }

    const { data: caseStudy, error } = await query.select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ caseStudy })
  } catch (error: any) {
    console.error('Admin case study PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update case study' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const result = await verifyAdmin(supabase, adminClient)
    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Case study ID required' }, { status: 400 })
    }

    let query = adminClient
      .from('case_studies')
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
  } catch (error: any) {
    console.error('Admin case study DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete case study' }, { status: 500 })
  }
}
