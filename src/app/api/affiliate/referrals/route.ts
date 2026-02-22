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
    const isAdmin = searchParams.get('admin') === 'true'

    if (isAdmin) {
      const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
      if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

      const { data: allAffiliates } = await admin
        .from('referral_links')
        .select('*')
        .eq('is_affiliate', true)
        .order('total_earnings_cents', { ascending: false })

      const affiliateIds = (allAffiliates || []).map((a: any) => a.user_id)
      const userEmails: Record<string, string> = {}

      if (affiliateIds.length > 0) {
        const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 })
        if (usersData?.users) {
          for (const u of usersData.users) {
            if (affiliateIds.includes(u.id)) {
              userEmails[u.id] = u.email || 'Unknown'
            }
          }
        }
      }

      const { data: allReferrals } = await admin
        .from('affiliate_referrals')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: allCommissions } = await admin
        .from('affiliate_commissions')
        .select('*')

      const { data: pendingPayouts } = await admin
        .from('affiliate_payouts')
        .select('*')
        .in('status', ['pending', 'approved'])

      const flaggedReferrals = (allReferrals || []).filter((r: any) => r.fraud_flags && r.fraud_flags.length > 0)

      const totalRevenue = (allCommissions || []).reduce((sum: number, c: any) => sum + (c.invoice_amount_cents || 0), 0)
      const totalCommissions = (allCommissions || []).reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

      return NextResponse.json({
        affiliates: (allAffiliates || []).map((a: any) => ({
          ...a,
          email: userEmails[a.user_id] || 'Unknown',
        })),
        referrals: allReferrals || [],
        flaggedReferrals,
        stats: {
          totalAffiliates: allAffiliates?.length || 0,
          totalReferrals: allReferrals?.length || 0,
          totalRevenue,
          totalCommissions,
          pendingPayouts: pendingPayouts?.length || 0,
          flaggedCount: flaggedReferrals.length,
        },
      })
    }

    const { data } = await admin
      .from('affiliate_referrals')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ referrals: data || [] })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ referrals: [], affiliates: [], stats: { totalAffiliates: 0, totalReferrals: 0, totalRevenue: 0, totalCommissions: 0, pendingPayouts: 0, flaggedCount: 0 } })
    }
    console.error('Affiliate referrals GET error:', err)
    return NextResponse.json({ error: 'Failed to load referrals' }, { status: 500 })
  }
}
