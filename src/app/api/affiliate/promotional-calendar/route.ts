import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/affiliate/audit'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: userRole } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (userRole?.role !== 'admin') return null
  return { user, admin }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'
    const campaignType = searchParams.get('type')
    const upcoming = searchParams.get('upcoming') === 'true'
    const includeContests = searchParams.get('include_contests') === 'true'
    const includeSocialPosts = searchParams.get('include_social') === 'true'

    const admin = createAdminClient()

    if (isAdmin) {
      const auth = await requireAdmin()
      if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

      let query = auth.admin
        .from('promotional_calendar')
        .select('*')
        .order('start_date', { ascending: false })

      if (campaignType) {
        query = query.eq('campaign_type', campaignType)
      }

      const { data, error } = await query

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205') return NextResponse.json({ events: [], note: 'Table not created yet' })
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ events: data || [] })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await admin
      .from('affiliate_profiles')
      .select('id, user_id, full_name, discount_code, referral_code')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })

    const now = new Date().toISOString().split('T')[0]

    let query = admin
      .from('promotional_calendar')
      .select('*')
      .eq('is_published', true)
      .order('start_date', { ascending: true })

    if (upcoming) {
      query = query.gte('start_date', now)
    }

    if (campaignType) {
      query = query.eq('campaign_type', campaignType)
    }

    const { data: events, error } = await query

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') return NextResponse.json({ events: [], contests: [], social_posts: [], note: 'Table not created yet' })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const enrichedEvents = (events || []).map((event: any) => {
      const startDate = new Date(event.start_date)
      const endDate = event.end_date ? new Date(event.end_date) : null
      const nowDate = new Date()
      const msPerDay = 86400000

      let status: 'upcoming' | 'active' | 'ended'
      let days_until_start: number | null = null
      let days_remaining: number | null = null

      if (nowDate < startDate) {
        status = 'upcoming'
        days_until_start = Math.ceil((startDate.getTime() - nowDate.getTime()) / msPerDay)
      } else if (endDate && nowDate > endDate) {
        status = 'ended'
      } else {
        status = 'active'
        if (endDate) {
          days_remaining = Math.ceil((endDate.getTime() - nowDate.getTime()) / msPerDay)
        }
      }

      return {
        ...event,
        status,
        days_until_start,
        days_remaining,
      }
    })

    const result: any = { events: enrichedEvents }

    if (includeContests) {
      const { data: contests } = await admin
        .from('affiliate_contests')
        .select('id, name, description, metric, start_date, end_date, prize_description, prize_amount_cents, status')
        .in('status', ['active', 'upcoming'])
        .order('start_date', { ascending: true })

      result.contests = contests || []
    }

    if (includeSocialPosts) {
      const { data: socialPosts } = await admin
        .from('social_posts')
        .select('id, content, platform, scheduled_for, status')
        .eq('user_id', user.id)
        .in('status', ['scheduled', 'draft'])
        .order('scheduled_for', { ascending: true })
        .limit(10)

      result.social_posts = socialPosts || []
    }

    if (enrichedEvents.length > 0) {
      const linkedAssetIds = enrichedEvents
        .flatMap((e: any) => e.linked_asset_ids || [])
        .filter((id: string) => id)

      if (linkedAssetIds.length > 0) {
        const { data: assets } = await admin
          .from('affiliate_assets')
          .select('id, title, description, asset_type, file_url, thumbnail_url, category')
          .in('id', linkedAssetIds)

        result.linked_assets = assets || []
      }

      const linkedContestIds = enrichedEvents
        .map((e: any) => e.linked_contest_id)
        .filter((id: string | null) => id)

      if (linkedContestIds.length > 0) {
        const { data: linkedContests } = await admin
          .from('affiliate_contests')
          .select('id, name, description, metric, start_date, end_date, prize_description, status')
          .in('id', linkedContestIds)

        result.linked_contests = linkedContests || []
      }
    }

    return NextResponse.json(result)
  } catch (err: any) {
    if (err?.code === '42P01' || err?.code === 'PGRST205' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ events: [], note: 'Table not created yet' })
    }
    console.error('Promotional Calendar GET error:', err)
    return NextResponse.json({ error: 'Failed to load promotional calendar' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { title, description, start_date, end_date, campaign_type, content_suggestions, linked_asset_ids, linked_contest_id, is_published } = body

    if (!title || !start_date) {
      return NextResponse.json({ error: 'Title and start_date are required' }, { status: 400 })
    }

    const validTypes = ['general', 'seasonal', 'feature_launch', 'flash_sale', 'holiday', 'contest']
    if (campaign_type && !validTypes.includes(campaign_type)) {
      return NextResponse.json({ error: `Invalid campaign_type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    const insertData: Record<string, any> = {
      title,
      description: description || '',
      start_date,
      end_date: end_date || null,
      campaign_type: campaign_type || 'general',
      content_suggestions: content_suggestions || [],
      linked_asset_ids: linked_asset_ids || [],
      linked_contest_id: linked_contest_id || null,
      is_published: is_published !== undefined ? is_published : true,
      created_by: auth.user.id,
    }

    const { data, error } = await auth.admin
      .from('promotional_calendar')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') return NextResponse.json({ error: 'Promotional calendar table not created yet. Run migration.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logAuditEvent({
      admin_user_id: auth.user.id,
      admin_email: auth.user.email!,
      action: 'create',
      entity_type: 'promotional_event',
      entity_id: data.id,
      entity_name: title,
      details: { campaign_type: campaign_type || 'general', start_date, end_date },
    })

    return NextResponse.json({ event: data })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.code === 'PGRST205' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Promotional calendar table not created yet. Run migration.' }, { status: 503 })
    }
    console.error('Promotional Calendar POST error:', err)
    return NextResponse.json({ error: 'Failed to create promotional event' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const allowedFields = [
      'title', 'description', 'start_date', 'end_date', 'campaign_type',
      'content_suggestions', 'linked_asset_ids', 'linked_contest_id', 'is_published',
    ]
    const filtered: Record<string, any> = {}
    for (const key of allowedFields) {
      if (key in updates) filtered[key] = updates[key]
    }

    if (filtered.campaign_type) {
      const validTypes = ['general', 'seasonal', 'feature_launch', 'flash_sale', 'holiday', 'contest']
      if (!validTypes.includes(filtered.campaign_type)) {
        return NextResponse.json({ error: `Invalid campaign_type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
      }
    }

    const { error } = await auth.admin
      .from('promotional_calendar')
      .update({ ...filtered, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') return NextResponse.json({ error: 'Promotional calendar table not created yet. Run migration.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logAuditEvent({
      admin_user_id: auth.user.id,
      admin_email: auth.user.email!,
      action: 'update',
      entity_type: 'promotional_event',
      entity_id: id,
      entity_name: filtered.title,
      details: filtered,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.code === 'PGRST205' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Promotional calendar table not created yet. Run migration.' }, { status: 503 })
    }
    console.error('Promotional Calendar PUT error:', err)
    return NextResponse.json({ error: 'Failed to update promotional event' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const { error } = await auth.admin
      .from('promotional_calendar')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') return NextResponse.json({ error: 'Promotional calendar table not created yet. Run migration.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logAuditEvent({
      admin_user_id: auth.user.id,
      admin_email: auth.user.email!,
      action: 'delete',
      entity_type: 'promotional_event',
      entity_id: id,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.code === 'PGRST205' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Promotional calendar table not created yet. Run migration.' }, { status: 503 })
    }
    console.error('Promotional Calendar DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete promotional event' }, { status: 500 })
  }
}
