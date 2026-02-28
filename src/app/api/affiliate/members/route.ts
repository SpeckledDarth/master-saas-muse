import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAffiliateTiers, getCurrentTier } from '@/lib/affiliate'
import { logAuditEvent } from '@/lib/affiliate/audit'
import { calculateFraudScore } from '@/lib/affiliate/fraud'

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

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { admin } = auth

    const { data: links } = await admin
      .from('referral_links')
      .select('*')
      .order('created_at', { ascending: false })

    if (!links || links.length === 0) {
      return NextResponse.json({ members: [] })
    }

    const userIds = links.map((l: any) => l.user_id)
    const userMap: Record<string, { email: string; name: string; lastSignIn: string | null }> = {}

    let page = 1
    let fetched = false
    while (!fetched) {
      const { data: usersData } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (!usersData?.users?.length) break
      for (const u of usersData.users) {
        if (userIds.includes(u.id)) {
          userMap[u.id] = {
            email: u.email || 'Unknown',
            name: u.user_metadata?.full_name || u.user_metadata?.name || '',
            lastSignIn: u.last_sign_in_at || null,
          }
        }
      }
      if (usersData.users.length < 1000) break
      page++
    }

    const { data: applications } = await admin
      .from('affiliate_applications')
      .select('email, name, status, reviewed_at')
      .in('status', ['approved', 'pending', 'rejected'])

    const appMap: Record<string, { name: string; status: string; reviewedAt: string | null }> = {}
    for (const app of applications || []) {
      appMap[app.email.toLowerCase()] = {
        name: app.name || '',
        status: app.status,
        reviewedAt: app.reviewed_at,
      }
    }

    let tiers: any[] = []
    try {
      tiers = await getAffiliateTiers()
    } catch {}

    const { data: commissions } = await admin
      .from('affiliate_commissions')
      .select('affiliate_user_id, commission_amount_cents, status, created_at')

    const earningsMap: Record<string, { pending: number; approved: number; paid: number }> = {}
    const trendMap: Record<string, Record<string, number>> = {}
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    const trendStartStr = thirtyDaysAgo.toISOString().slice(0, 10)

    for (const c of commissions || []) {
      if (!earningsMap[c.affiliate_user_id]) {
        earningsMap[c.affiliate_user_id] = { pending: 0, approved: 0, paid: 0 }
      }
      if (c.status === 'pending') earningsMap[c.affiliate_user_id].pending += c.commission_amount_cents
      else if (c.status === 'approved') earningsMap[c.affiliate_user_id].approved += c.commission_amount_cents
      else if (c.status === 'paid') earningsMap[c.affiliate_user_id].paid += c.commission_amount_cents

      if (c.created_at && c.created_at.slice(0, 10) >= trendStartStr) {
        const dayStr = c.created_at.slice(0, 10)
        if (!trendMap[c.affiliate_user_id]) trendMap[c.affiliate_user_id] = {}
        trendMap[c.affiliate_user_id][dayStr] = (trendMap[c.affiliate_user_id][dayStr] || 0) + (c.commission_amount_cents || 0)
      }
    }

    function buildTrendArray(userId: string): number[] {
      const userTrend = trendMap[userId] || {}
      const trend: number[] = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dayStr = d.toISOString().slice(0, 10)
        trend.push(userTrend[dayStr] || 0)
      }
      return trend
    }

    const members = links.map((link: any) => {
      const userData = userMap[link.user_id] || { email: 'Unknown', name: '', lastSignIn: null }
      const appData = appMap[userData.email.toLowerCase()]
      const currentTier = getCurrentTier(link.signups || 0, tiers)
      const earnings = earningsMap[link.user_id] || { pending: 0, approved: 0, paid: 0 }

      let status: string
      if (!link.is_affiliate) {
        status = 'inactive'
      } else if (userData.lastSignIn || (link.signups && link.signups > 0) || appData?.status === 'approved') {
        status = 'active'
      } else {
        status = 'pending_setup'
      }

      return {
        userId: link.user_id,
        email: userData.email,
        name: userData.name || appData?.name || '',
        refCode: link.ref_code,
        isAffiliate: link.is_affiliate || false,
        status,
        suspended: link.suspended || false,
        suspensionReason: link.suspension_reason || null,
        fraudScore: link.fraud_score || 0,
        fraudScoreUpdatedAt: link.fraud_score_updated_at || null,
        tier: currentTier?.name || 'None',
        referrals: link.signups || 0,
        clicks: link.clicks || 0,
        totalEarnings: link.total_earnings_cents || 0,
        pendingEarnings: earnings.pending,
        paidEarnings: earnings.paid,
        lockedRate: link.locked_commission_rate,
        lockedDuration: link.locked_duration_months,
        joinedAt: link.created_at,
        lastSignIn: userData.lastSignIn,
        applicationStatus: appData?.status || null,
        earningsTrend: buildTrendArray(link.user_id),
      }
    })

    return NextResponse.json({ members })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ members: [] })
    }
    console.error('Affiliate members GET error:', err)
    return NextResponse.json({ error: 'Failed to load affiliate members' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { admin } = auth
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const { data: link } = await admin
      .from('referral_links')
      .select('id, user_id, ref_code')
      .eq('user_id', userId)
      .maybeSingle()

    if (!link) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    await admin.from('affiliate_commissions').delete().eq('affiliate_user_id', userId)
    await admin.from('affiliate_payouts').delete().eq('affiliate_user_id', userId)
    await admin.from('affiliate_referrals').delete().eq('affiliate_user_id', userId)
    await admin.from('referral_links').delete().eq('user_id', userId)

    const userInfo = await admin.auth.admin.getUserById(userId)
    if (userInfo?.data?.user?.email) {
      await admin.from('affiliate_applications').delete().eq('email', userInfo.data.user.email.toLowerCase())
    }

    await admin.from('user_roles').delete().eq('user_id', userId).eq('role', 'affiliate')

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ success: true })
    }
    console.error('Affiliate member DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete affiliate' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { admin, user } = auth
    const body = await request.json()
    const { userId, action, reason } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 })
    }

    if (action === 'suspend') {
      const { error } = await admin
        .from('referral_links')
        .update({
          suspended: true,
          suspension_reason: reason || 'Suspended by admin',
        })
        .eq('user_id', userId)

      if (error) {
        if (error.code === '42703') {
          return NextResponse.json({ error: 'Suspension columns not yet available. Run migration 010.' }, { status: 503 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      logAuditEvent({
        admin_user_id: user.id,
        admin_email: user.email!,
        action: 'update',
        entity_type: 'member',
        entity_id: userId,
        details: { action: 'suspend', reason },
      })

      return NextResponse.json({ success: true, action: 'suspended' })
    }

    if (action === 'unsuspend') {
      const { error } = await admin
        .from('referral_links')
        .update({
          suspended: false,
          suspension_reason: null,
        })
        .eq('user_id', userId)

      if (error) {
        if (error.code === '42703') {
          return NextResponse.json({ error: 'Suspension columns not yet available. Run migration 010.' }, { status: 503 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      logAuditEvent({
        admin_user_id: user.id,
        admin_email: user.email!,
        action: 'update',
        entity_type: 'member',
        entity_id: userId,
        details: { action: 'unsuspend' },
      })

      return NextResponse.json({ success: true, action: 'unsuspended' })
    }

    if (action === 'recalculate_fraud') {
      const result = await calculateFraudScore(userId)

      logAuditEvent({
        admin_user_id: user.id,
        admin_email: user.email!,
        action: 'update',
        entity_type: 'member',
        entity_id: userId,
        details: { action: 'recalculate_fraud', score: result.score, signals: result.signals.map(s => s.signal) },
      })

      return NextResponse.json({ success: true, fraudScore: result })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err: any) {
    console.error('Affiliate member PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update affiliate' }, { status: 500 })
  }
}
