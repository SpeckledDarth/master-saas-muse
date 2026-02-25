import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const [settingsRes, linkRes, auditRes] = await Promise.all([
      admin.from('affiliate_program_settings').select('commission_rate, commission_duration_months, min_payout_cents, updated_at').maybeSingle(),
      admin.from('referral_links').select('locked_commission_rate, locked_duration_months, locked_at').eq('user_id', user.id).maybeSingle(),
      admin.from('audit_logs').select('action, details, created_at').eq('entity_type', 'settings').order('created_at', { ascending: false }).limit(10),
    ])

    const currentSettings = settingsRes.data
    const myTerms = linkRes.data
    const auditLogs = auditRes.data || []

    const changelog = auditLogs
      .filter((log: any) => log.details?.old && log.details?.new)
      .map((log: any) => {
        const changes: string[] = []
        const oldVals = log.details.old || {}
        const newVals = log.details.new || {}
        if (oldVals.commission_rate !== undefined && newVals.commission_rate !== undefined && oldVals.commission_rate !== newVals.commission_rate) {
          changes.push(`Default commission rate changed from ${oldVals.commission_rate}% to ${newVals.commission_rate}%`)
        }
        if (oldVals.commission_duration_months !== undefined && newVals.commission_duration_months !== undefined && oldVals.commission_duration_months !== newVals.commission_duration_months) {
          changes.push(`Commission duration changed from ${oldVals.commission_duration_months} to ${newVals.commission_duration_months} months`)
        }
        if (oldVals.min_payout_cents !== undefined && newVals.min_payout_cents !== undefined && oldVals.min_payout_cents !== newVals.min_payout_cents) {
          changes.push(`Minimum payout changed from $${(oldVals.min_payout_cents / 100).toFixed(2)} to $${(newVals.min_payout_cents / 100).toFixed(2)}`)
        }
        return { date: log.created_at, changes }
      })
      .filter((entry: any) => entry.changes.length > 0)

    const hasLockedTerms = !!myTerms?.locked_at
    const lockedRate = myTerms?.locked_commission_rate
    const lockedDuration = myTerms?.locked_duration_months

    return NextResponse.json({
      currentDefaults: currentSettings ? {
        commissionRate: currentSettings.commission_rate,
        durationMonths: currentSettings.commission_duration_months,
        minPayoutCents: currentSettings.min_payout_cents,
        lastUpdated: currentSettings.updated_at,
      } : null,
      myTerms: hasLockedTerms ? {
        rate: lockedRate,
        durationMonths: lockedDuration,
        lockedAt: myTerms.locked_at,
        isProtected: true,
      } : null,
      changelog,
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ currentDefaults: null, myTerms: null, changelog: [] })
    }
    console.error('Terms changelog error:', err)
    return NextResponse.json({ error: 'Failed to load terms changelog' }, { status: 500 })
  }
}
