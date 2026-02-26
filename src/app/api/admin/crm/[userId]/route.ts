import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, isErrorResponse, safeTableError } from '@/lib/admin-auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth
    const { userId } = await params

    const { data: authData } = await adminClient.auth.admin.getUserById(userId)
    if (!authData?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const authUser = authData.user

    let profile: any = null
    try {
      const { data, error } = await adminClient.from('user_profiles').select('*').eq('user_id', userId).maybeSingle()
      if (!error) profile = data
    } catch {}

    let subscriptions: any[] = []
    try {
      const { data, error } = await adminClient.from('muse_product_subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (!error && data) subscriptions = data
    } catch {}

    let userInvoices: any[] = []
    try {
      const { data, error } = await adminClient.from('invoices').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (!error && data) userInvoices = data
    } catch {}

    let payments: any[] = []
    try {
      const { data, error } = await adminClient.from('payments').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (!error && data) payments = data
    } catch {}

    let affiliateProfile: any = null
    try {
      const { data, error } = await adminClient.from('affiliate_profiles').select('*').eq('user_id', userId).maybeSingle()
      if (!error) affiliateProfile = data
    } catch {}

    let commissions: any[] = []
    let referrals: any[] = []
    let payouts: any[] = []
    if (affiliateProfile) {
      try {
        const { data, error } = await adminClient.from('affiliate_commissions').select('*').eq('affiliate_user_id', userId).order('created_at', { ascending: false })
        if (!error && data) commissions = data
      } catch {}

      try {
        const { data, error } = await adminClient.from('affiliate_referrals').select('*').eq('affiliate_user_id', userId).order('created_at', { ascending: false })
        if (!error && data) referrals = data
      } catch {}

      try {
        const { data, error } = await adminClient.from('affiliate_payouts').select('*').eq('affiliate_user_id', userId).order('created_at', { ascending: false })
        if (!error && data) payouts = data
      } catch {}
    }

    let userActivities: any[] = []
    try {
      const { data, error } = await adminClient.from('activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
      if (!error && data) userActivities = data
    } catch {}

    let tickets: any[] = []
    try {
      const { data, error } = await adminClient.from('tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (!error && data) tickets = data
    } catch {}

    let notes: any[] = []
    try {
      const { data, error } = await adminClient.from('entity_notes').select('*').eq('entity_type', 'user').eq('entity_id', userId).order('created_at', { ascending: false })
      if (!error && data) notes = data
    } catch {}

    let contracts: any[] = []
    try {
      const { data, error } = await adminClient.from('contracts').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (!error && data) contracts = data
    } catch {}

    let tags: any[] = []
    try {
      const { data, error } = await adminClient.from('user_tags').select('*').eq('user_id', userId).order('created_at', { ascending: true })
      if (!error && data) tags = data
    } catch {}

    let orgMembership: any = null
    try {
      const { data, error } = await adminClient.from('organization_members').select('role').eq('user_id', userId).maybeSingle()
      if (!error) orgMembership = data
    } catch {}

    let stripeCustomerId: string | null = null
    try {
      const { data, error } = await adminClient.from('stripe_customers').select('stripe_customer_id').eq('user_id', userId).maybeSingle()
      if (!error && data) stripeCustomerId = data.stripe_customer_id
    } catch {}

    const totalRevenue = userInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount_paid_cents || 0), 0)
    const activeSub = subscriptions.find(s => s.status === 'active' || s.status === 'trialing')
    const plan = activeSub?.tier_id || (activeSub ? 'active' : 'free')

    const now = Date.now()
    const lastSignIn = authUser.last_sign_in_at
    const daysSinceLogin = lastSignIn ? (now - new Date(lastSignIn).getTime()) / (24 * 60 * 60 * 1000) : 999
    const loginScore = Math.max(0, 40 - (daysSinceLogin / 30) * 40)
    const subScore = activeSub ? 30 : 0
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
    const recentActivityCount = userActivities.filter(a => new Date(a.created_at) >= thirtyDaysAgo).length
    const activityScore = Math.min(30, recentActivityCount)
    const healthScore = Math.round(loginScore + subScore + activityScore)

    const types: string[] = []
    if (activeSub) types.push('Subscriber')
    if (affiliateProfile) types.push('Affiliate')
    if (orgMembership) types.push('Team')

    const transactions = [
      ...userInvoices.map(i => ({ ...i, _type: 'invoice' as const, _date: i.created_at, _amount: i.amount_paid_cents || i.amount_due_cents || 0 })),
      ...payments.map(p => ({ ...p, _type: 'payment' as const, _date: p.created_at, _amount: p.amount_cents || 0 })),
      ...commissions.map(c => ({ ...c, _type: 'commission' as const, _date: c.created_at, _amount: c.amount_cents || 0 })),
      ...payouts.map(p => ({ ...p, _type: 'payout' as const, _date: p.created_at, _amount: p.amount_cents || 0 })),
    ].sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime())

    let affiliateSummary = null
    if (affiliateProfile) {
      const totalCommissions = commissions.reduce((sum, c) => sum + (c.amount_cents || 0), 0)
      const totalPayouts = payouts.reduce((sum, p) => sum + (p.amount_cents || 0), 0)
      const conversions = referrals.filter(r => r.status === 'converted').length
      const conversionRate = referrals.length > 0 ? (conversions / referrals.length) * 100 : 0

      affiliateSummary = {
        referralCount: referrals.length,
        totalCommissions,
        totalPayouts,
        currentTier: affiliateProfile.tier_id || affiliateProfile.current_tier || 'default',
        conversionRate: Math.round(conversionRate * 10) / 10,
        status: affiliateProfile.status || 'active',
      }
    }

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.display_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Unknown',
        avatar_url: authUser.user_metadata?.avatar_url || null,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        types,
        plan,
        totalRevenue,
        healthScore,
        daysSinceLogin: Math.round(daysSinceLogin),
        stripeCustomerId,
      },
      profile,
      subscriptions,
      transactions,
      activities: userActivities,
      tickets,
      notes,
      contracts,
      tags,
      affiliateSummary,
    })
  } catch (err) {
    console.error('CRM detail error:', err)
    return NextResponse.json({ error: 'Failed to load user details' }, { status: 500 })
  }
}
