import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: renewals, error } = await admin
      .from('commission_renewals')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching renewals:', error)
      return NextResponse.json({ renewals: [] })
    }

    const { data: referrals } = await admin
      .from('affiliate_referrals')
      .select('id, status, created_at, commission_end_date, health_status')
      .eq('affiliate_user_id', user.id)
      .not('status', 'eq', 'churned')

    const { data: link } = await admin
      .from('referral_links')
      .select('locked_duration_months')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: settingsRows } = await admin
      .from('affiliate_settings')
      .select('key, value')
      .in('key', ['commission_duration_months'])

    const settingsMap: Record<string, string> = {}
    ;(settingsRows || []).forEach((s: any) => { settingsMap[s.key] = s.value })
    const durationMonths = link?.locked_duration_months || parseInt(settingsMap.commission_duration_months || '12')

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const expiringReferrals = (referrals || []).filter(r => {
      let endDate: Date
      if (r.commission_end_date) {
        endDate = new Date(r.commission_end_date)
      } else {
        endDate = new Date(r.created_at)
        endDate.setMonth(endDate.getMonth() + durationMonths)
      }
      return endDate <= thirtyDaysFromNow && endDate >= now
    }).map(r => {
      let endDate: Date
      if (r.commission_end_date) {
        endDate = new Date(r.commission_end_date)
      } else {
        endDate = new Date(r.created_at)
        endDate.setMonth(endDate.getMonth() + durationMonths)
      }
      return {
        ...r,
        computed_end_date: endDate.toISOString().split('T')[0],
        days_remaining: Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }
    })

    const allRenewals = renewals || []
    const totalRequests = allRenewals.length
    const approvedRenewals = allRenewals.filter((r: any) => r.status === 'approved')
    const deniedRenewals = allRenewals.filter((r: any) => r.status === 'denied')
    const pendingRenewals = allRenewals.filter((r: any) => r.status === 'pending')
    const decidedCount = approvedRenewals.length + deniedRenewals.length
    const successRate = decidedCount > 0 ? Math.round((approvedRenewals.length / decidedCount) * 100) : 0

    let totalExtensionDays = 0
    for (const r of approvedRenewals) {
      const orig = new Date(r.original_end_date)
      const renewed = new Date(r.renewed_end_date)
      totalExtensionDays += Math.round((renewed.getTime() - orig.getTime()) / (1000 * 60 * 60 * 24))
    }
    const avgExtensionDays = approvedRenewals.length > 0 ? Math.round(totalExtensionDays / approvedRenewals.length) : 0

    const approvedReferralIds = approvedRenewals.map((r: any) => r.referral_id)
    let revenueSavedCents = 0
    if (approvedReferralIds.length > 0) {
      const { data: commissions } = await admin
        .from('affiliate_commissions')
        .select('referral_id, commission_amount_cents, created_at')
        .eq('affiliate_user_id', user.id)
        .in('referral_id', approvedReferralIds)

      if (commissions && commissions.length > 0) {
        const commissionsByReferral: Record<string, number[]> = {}
        for (const c of commissions) {
          if (!commissionsByReferral[c.referral_id]) {
            commissionsByReferral[c.referral_id] = []
          }
          commissionsByReferral[c.referral_id].push(c.commission_amount_cents)
        }

        for (const referralId of approvedReferralIds) {
          const amounts = commissionsByReferral[referralId]
          if (amounts && amounts.length > 0) {
            const avgCommission = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length
            const renewal = approvedRenewals.find((r: any) => r.referral_id === referralId)
            if (renewal) {
              const extensionDays = Math.round(
                (new Date(renewal.renewed_end_date).getTime() - new Date(renewal.original_end_date).getTime()) / (1000 * 60 * 60 * 24)
              )
              const extensionMonths = Math.max(1, Math.round(extensionDays / 30))
              revenueSavedCents += Math.round(avgCommission * extensionMonths)
            }
          }
        }
      }
    }

    const stats = {
      totalRequests,
      approved: approvedRenewals.length,
      denied: deniedRenewals.length,
      pending: pendingRenewals.length,
      successRate,
      avgExtensionDays,
      revenueSavedCents,
    }

    return NextResponse.json({
      renewals: allRenewals,
      expiringReferrals,
      durationMonths,
      stats,
    })
  } catch (err) {
    console.error('Renewals GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const isBulk = Array.isArray(body.referral_ids) && body.referral_ids.length > 0

    if (isBulk) {
      const { referral_ids, check_in_type, check_in_notes } = body

      if (!check_in_type) {
        return NextResponse.json({ error: 'Missing required field: check_in_type' }, { status: 400 })
      }
      if (!['email', 'call', 'note'].includes(check_in_type)) {
        return NextResponse.json({ error: 'Invalid check_in_type. Must be email, call, or note.' }, { status: 400 })
      }
      if (referral_ids.length > 50) {
        return NextResponse.json({ error: 'Maximum 50 referrals per bulk request' }, { status: 400 })
      }

      const admin = createAdminClient()

      const { data: referrals } = await admin
        .from('affiliate_referrals')
        .select('id, affiliate_user_id, created_at, commission_end_date')
        .in('id', referral_ids)
        .eq('affiliate_user_id', user.id)

      if (!referrals || referrals.length === 0) {
        return NextResponse.json({ error: 'No valid referrals found' }, { status: 404 })
      }

      const { data: existingPending } = await admin
        .from('commission_renewals')
        .select('referral_id')
        .in('referral_id', referral_ids)
        .eq('affiliate_user_id', user.id)
        .eq('status', 'pending')

      const pendingSet = new Set((existingPending || []).map((p: any) => p.referral_id))

      const { data: linkData } = await admin
        .from('referral_links')
        .select('locked_duration_months')
        .eq('user_id', user.id)
        .maybeSingle()

      const { data: settingsRows } = await admin
        .from('affiliate_settings')
        .select('key, value')
        .in('key', ['commission_duration_months'])

      const sMap: Record<string, string> = {}
      ;(settingsRows || []).forEach((s: any) => { sMap[s.key] = s.value })
      const durMonths = linkData?.locked_duration_months || parseInt(sMap.commission_duration_months || '12')

      const inserts: any[] = []
      const skipped: { referral_id: string; reason: string }[] = []

      for (const ref of referrals) {
        if (pendingSet.has(ref.id)) {
          skipped.push({ referral_id: ref.id, reason: 'pending_renewal_exists' })
          continue
        }

        let originalEndDate: Date
        if (ref.commission_end_date) {
          originalEndDate = new Date(ref.commission_end_date)
        } else {
          originalEndDate = new Date(ref.created_at)
          originalEndDate.setMonth(originalEndDate.getMonth() + durMonths)
        }

        const renewedDate = new Date(originalEndDate)
        renewedDate.setMonth(renewedDate.getMonth() + 3)

        inserts.push({
          affiliate_user_id: user.id,
          referral_id: ref.id,
          original_end_date: originalEndDate.toISOString().split('T')[0],
          renewed_end_date: renewedDate.toISOString().split('T')[0],
          check_in_type,
          check_in_notes: check_in_notes || null,
          status: 'pending',
        })
      }

      const notFound = referral_ids.filter((id: string) => !referrals.find((r: any) => r.id === id))
      for (const id of notFound) {
        skipped.push({ referral_id: id, reason: 'not_found_or_not_yours' })
      }

      let created: any[] = []
      if (inserts.length > 0) {
        const { data: inserted, error: insertError } = await admin
          .from('commission_renewals')
          .insert(inserts)
          .select()

        if (insertError) {
          console.error('Error creating bulk renewals:', insertError)
          return NextResponse.json({ error: 'Failed to create renewal requests' }, { status: 500 })
        }
        created = inserted || []
      }

      return NextResponse.json({
        renewals: created,
        skipped,
        summary: {
          requested: referral_ids.length,
          created: created.length,
          skipped: skipped.length,
        },
      })
    }

    const { referral_id, check_in_type, check_in_notes, original_end_date } = body

    if (!referral_id || !check_in_type || !original_end_date) {
      return NextResponse.json({ error: 'Missing required fields: referral_id, check_in_type, original_end_date' }, { status: 400 })
    }

    if (!['email', 'call', 'note'].includes(check_in_type)) {
      return NextResponse.json({ error: 'Invalid check_in_type. Must be email, call, or note.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: referral } = await admin
      .from('affiliate_referrals')
      .select('id, affiliate_user_id')
      .eq('id', referral_id)
      .eq('affiliate_user_id', user.id)
      .maybeSingle()

    if (!referral) {
      return NextResponse.json({ error: 'Referral not found or not yours' }, { status: 404 })
    }

    const { data: existingPending } = await admin
      .from('commission_renewals')
      .select('id')
      .eq('referral_id', referral_id)
      .eq('affiliate_user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingPending) {
      return NextResponse.json({ error: 'A pending renewal request already exists for this referral' }, { status: 409 })
    }

    const originalDate = new Date(original_end_date)
    const renewedDate = new Date(originalDate)
    renewedDate.setMonth(renewedDate.getMonth() + 3)

    const { data: renewal, error } = await admin
      .from('commission_renewals')
      .insert({
        affiliate_user_id: user.id,
        referral_id,
        original_end_date,
        renewed_end_date: renewedDate.toISOString().split('T')[0],
        check_in_type,
        check_in_notes: check_in_notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating renewal:', error)
      return NextResponse.json({ error: 'Failed to create renewal request' }, { status: 500 })
    }

    return NextResponse.json({ renewal })
  } catch (err) {
    console.error('Renewals POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
