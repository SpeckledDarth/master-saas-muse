import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function handleTableNotFound(err: any) {
  return err?.code === '42P01' || err?.code === 'PGRST205' || err?.message?.includes('does not exist')
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const includeCompleted = searchParams.get('include_completed') === 'true'

    let contestQuery = admin
      .from('affiliate_contests')
      .select('*')
      .eq('type', 'challenge')
      .order('start_date', { ascending: false })

    if (status) {
      contestQuery = contestQuery.eq('status', status)
    } else if (!includeCompleted) {
      contestQuery = contestQuery.in('status', ['active', 'upcoming'])
    }

    const { data: contests, error: contestsError } = await contestQuery

    if (contestsError) {
      if (handleTableNotFound(contestsError)) {
        let fallbackQuery = admin
          .from('affiliate_contests')
          .select('*')
          .order('start_date', { ascending: false })

        if (status) {
          fallbackQuery = fallbackQuery.eq('status', status)
        } else if (!includeCompleted) {
          fallbackQuery = fallbackQuery.in('status', ['active', 'upcoming'])
        }

        const { data: allContests, error: fallbackError } = await fallbackQuery

        if (fallbackError) {
          if (handleTableNotFound(fallbackError)) {
            return NextResponse.json({ challenges: [], progress: [], note: 'Table not created yet' })
          }
          return NextResponse.json({ error: fallbackError.message }, { status: 500 })
        }

        const challengeContests = (allContests || []).filter((c: any) =>
          c.type === 'challenge' || c.name?.toLowerCase().includes('challenge')
        )

        const progressMap = await getProgressForAffiliate(admin, user.id, challengeContests.map((c: any) => c.id))

        return NextResponse.json({
          challenges: enrichChallenges(challengeContests, progressMap),
          progress: Object.values(progressMap),
        })
      }
      return NextResponse.json({ error: contestsError.message }, { status: 500 })
    }

    const challengeIds = (contests || []).map((c: any) => c.id)
    const progressMap = await getProgressForAffiliate(admin, user.id, challengeIds)

    return NextResponse.json({
      challenges: enrichChallenges(contests || [], progressMap),
      progress: Object.values(progressMap),
    })
  } catch (err: any) {
    if (handleTableNotFound(err)) {
      return NextResponse.json({ challenges: [], progress: [], note: 'Table not created yet' })
    }
    console.error('Challenges GET error:', err)
    return NextResponse.json({ error: 'Failed to load challenges' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const body = await request.json()
    const { challenge_id, action, metadata } = body

    if (!challenge_id) {
      return NextResponse.json({ error: 'challenge_id is required' }, { status: 400 })
    }

    const { data: contest, error: contestError } = await admin
      .from('affiliate_contests')
      .select('*')
      .eq('id', challenge_id)
      .maybeSingle()

    if (contestError) {
      if (handleTableNotFound(contestError)) {
        return NextResponse.json({ error: 'Challenges table not created yet. Run migration.' }, { status: 503 })
      }
      return NextResponse.json({ error: contestError.message }, { status: 500 })
    }

    if (!contest) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (contest.status !== 'active') {
      return NextResponse.json({ error: 'Challenge is not currently active' }, { status: 400 })
    }

    const now = new Date()
    if (contest.end_date && new Date(contest.end_date) < now) {
      return NextResponse.json({ error: 'Challenge has ended' }, { status: 400 })
    }

    const targetCount = contest.target_count || contest.prize_amount_cents || 3
    let existingProgress = await getOrCreateProgress(admin, challenge_id, user.id, targetCount)

    if (existingProgress.completed_at) {
      return NextResponse.json({
        message: 'Challenge already completed',
        progress: existingProgress,
        already_completed: true,
      })
    }

    const newCount = (existingProgress.progress_count || 0) + 1
    const isNowComplete = newCount >= existingProgress.target_count

    const updateData: Record<string, any> = {
      progress_count: newCount,
      updated_at: new Date().toISOString(),
    }

    if (isNowComplete) {
      updateData.completed_at = new Date().toISOString()
    }

    const { error: updateError } = await admin
      .from('challenge_progress')
      .update(updateData)
      .eq('challenge_id', challenge_id)
      .eq('affiliate_id', user.id)

    if (updateError) {
      if (handleTableNotFound(updateError)) {
        return NextResponse.json({ error: 'Challenge progress table not created yet. Run migration.' }, { status: 503 })
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (action === 'asset_shared' && metadata?.asset_id) {
      try {
        await admin.from('affiliate_asset_usage').insert({
          asset_id: metadata.asset_id,
          affiliate_id: user.id,
          action: 'share',
          metadata: { challenge_id, ...(metadata || {}) },
        })
      } catch {}
    }

    let badgeAwarded = null
    if (isNowComplete) {
      try {
        const { checkAndAwardBadges } = await import('@/lib/affiliate/badges')
        const badges = await checkAndAwardBadges(user.id)
        if (badges.length > 0) {
          badgeAwarded = badges
        }
      } catch {}

      try {
        await admin.from('notifications').insert({
          user_id: user.id,
          title: `Challenge Complete: ${contest.name}!`,
          message: `You completed the "${contest.name}" challenge! ${contest.prize_description || 'Great job!'}`,
          type: 'success',
          link: '/affiliate/dashboard?section=challenges',
        })
      } catch {}

      try {
        const challengeBadgeType = `challenge_${challenge_id.substring(0, 8)}`
        await admin.from('affiliate_badges').insert({
          affiliate_user_id: user.id,
          badge_type: challengeBadgeType,
          threshold_cents: 0,
          awarded_at: new Date().toISOString(),
          is_active: true,
        })
      } catch {}
    }

    const updatedProgress = {
      ...existingProgress,
      progress_count: newCount,
      completed_at: isNowComplete ? updateData.completed_at : null,
    }

    return NextResponse.json({
      progress: updatedProgress,
      completed: isNowComplete,
      badge_awarded: badgeAwarded,
      message: isNowComplete
        ? `Congratulations! You completed the "${contest.name}" challenge!`
        : `Progress updated: ${newCount}/${existingProgress.target_count}`,
    })
  } catch (err: any) {
    if (handleTableNotFound(err)) {
      return NextResponse.json({ error: 'Challenge tables not created yet. Run migration.' }, { status: 503 })
    }
    console.error('Challenges POST error:', err)
    return NextResponse.json({ error: 'Failed to record challenge progress' }, { status: 500 })
  }
}

async function getProgressForAffiliate(
  admin: any,
  affiliateId: string,
  challengeIds: string[]
): Promise<Record<string, any>> {
  const progressMap: Record<string, any> = {}

  if (challengeIds.length === 0) return progressMap

  try {
    const { data, error } = await admin
      .from('challenge_progress')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .in('challenge_id', challengeIds)

    if (error) {
      if (handleTableNotFound(error)) return progressMap
      console.error('Failed to fetch challenge progress:', error.message)
      return progressMap
    }

    for (const row of (data || [])) {
      progressMap[row.challenge_id] = row
    }
  } catch (err) {
    console.error('getProgressForAffiliate error:', err)
  }

  return progressMap
}

async function getOrCreateProgress(
  admin: any,
  challengeId: string,
  affiliateId: string,
  targetCount: number
): Promise<any> {
  const { data: existing, error: fetchError } = await admin
    .from('challenge_progress')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('affiliate_id', affiliateId)
    .maybeSingle()

  if (fetchError && !handleTableNotFound(fetchError)) {
    throw fetchError
  }

  if (existing) return existing

  const { data: created, error: createError } = await admin
    .from('challenge_progress')
    .insert({
      challenge_id: challengeId,
      affiliate_id: affiliateId,
      progress_count: 0,
      target_count: targetCount,
    })
    .select()
    .single()

  if (createError) {
    if (handleTableNotFound(createError)) {
      return {
        challenge_id: challengeId,
        affiliate_id: affiliateId,
        progress_count: 0,
        target_count: targetCount,
        completed_at: null,
      }
    }
    throw createError
  }

  return created
}

function enrichChallenges(contests: any[], progressMap: Record<string, any>): any[] {
  const now = new Date()

  return contests.map((contest) => {
    const progress = progressMap[contest.id]
    const endDate = contest.end_date ? new Date(contest.end_date) : null
    const startDate = contest.start_date ? new Date(contest.start_date) : null

    let timeRemaining = null
    if (endDate && endDate > now) {
      const diffMs = endDate.getTime() - now.getTime()
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      timeRemaining = { days, hours, total_ms: diffMs }
    }

    let computedStatus = contest.status
    if (startDate && startDate > now) computedStatus = 'upcoming'
    else if (endDate && endDate < now) computedStatus = 'completed'
    else if (startDate && startDate <= now && (!endDate || endDate >= now)) computedStatus = 'active'

    return {
      id: contest.id,
      name: contest.name,
      description: contest.description,
      metric: contest.metric,
      start_date: contest.start_date,
      end_date: contest.end_date,
      prize_description: contest.prize_description,
      prize_amount_cents: contest.prize_amount_cents,
      status: computedStatus,
      target_count: contest.target_count || contest.prize_amount_cents || 3,
      time_remaining: timeRemaining,
      progress: progress ? {
        progress_count: progress.progress_count || 0,
        target_count: progress.target_count || contest.target_count || 3,
        completed_at: progress.completed_at,
        percentage: Math.min(
          100,
          Math.round(((progress.progress_count || 0) / (progress.target_count || 3)) * 100)
        ),
      } : {
        progress_count: 0,
        target_count: contest.target_count || 3,
        completed_at: null,
        percentage: 0,
      },
    }
  })
}
