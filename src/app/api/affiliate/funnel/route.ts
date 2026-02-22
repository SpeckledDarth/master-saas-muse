import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '30d'

    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === 'all' ? 3650 : 30
    const since = new Date(Date.now() - days * 86400000).toISOString()

    let refCode: string | null = null
    try {
      const { data: link } = await adminClient
        .from('referral_links')
        .select('ref_code, is_affiliate')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!link?.is_affiliate) {
        return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
      }
      refCode = link.ref_code
    } catch (e: any) {
      if (e?.code === '42P01') return NextResponse.json({ funnel: [], period })
      throw e
    }

    let clicks = 0
    let signups = 0
    let conversions = 0

    try {
      const { count: clickCount, error } = await adminClient
        .from('referral_clicks')
        .select('id', { count: 'exact', head: true })
        .eq('ref_code', refCode)
        .gte('created_at', since)

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          clicks = 0
        } else throw error
      } else {
        clicks = clickCount || 0
      }
    } catch (e: any) {
      if (e?.code === '42P01') clicks = 0
      else throw e
    }

    try {
      const { data: referrals, error } = await adminClient
        .from('affiliate_referrals')
        .select('id, status, referred_user_id')
        .eq('affiliate_user_id', user.id)
        .gte('created_at', since)

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          signups = 0; conversions = 0
        } else throw error
      } else {
        signups = referrals?.length || 0
        conversions = referrals?.filter(r => r.status === 'converted').length || 0
      }
    } catch (e: any) {
      if (e?.code === '42P01') { signups = 0; conversions = 0 }
      else throw e
    }

    const paidConversions = Math.min(conversions, (() => {
      return conversions
    })())

    let paidCount = 0
    try {
      const { data: commissions, error } = await adminClient
        .from('affiliate_commissions')
        .select('referral_id')
        .eq('affiliate_user_id', user.id)
        .gte('created_at', since)

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          paidCount = 0
        } else throw error
      } else {
        const uniqueReferralIds = new Set(commissions?.map(c => c.referral_id).filter(Boolean))
        paidCount = uniqueReferralIds.size || commissions?.length || 0
      }
    } catch (e: any) {
      if (e?.code === '42P01') paidCount = 0
      else throw e
    }

    const safePaidCount = Math.min(paidCount, conversions)

    const funnel = [
      { stage: 'Clicks', count: clicks },
      { stage: 'Signups', count: signups },
      { stage: 'Conversions', count: conversions },
      { stage: 'Paid', count: safePaidCount },
    ]

    const rates = funnel.map((step, i) => {
      if (i === 0) return { ...step, rate: 100 }
      const prev = funnel[i - 1].count
      return {
        ...step,
        rate: prev > 0 ? Math.round((step.count / prev) * 100) : 0,
      }
    })

    return NextResponse.json({ funnel: rates, period })
  } catch (error) {
    console.error('Funnel error:', error)
    return NextResponse.json({ funnel: [], period: '30d' })
  }
}
