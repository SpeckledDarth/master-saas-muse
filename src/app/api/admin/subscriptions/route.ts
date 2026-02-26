import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, isErrorResponse } from '@/lib/admin-auth'

interface SubscriptionRow {
  id: string
  user_id: string
  user_name: string
  user_email: string
  product_name: string
  tier: string
  status: string
  amount_cents: number
  renewal_date: string | null
  cancel_at_period_end: boolean
  churn_risk: boolean
  created_at: string
  stripe_subscription_id: string | null
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth

    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status') || ''
    const tierFilter = url.searchParams.get('tier') || ''
    const churnRisk = url.searchParams.get('churnRisk') || ''
    const search = url.searchParams.get('search') || ''
    const sort = url.searchParams.get('sort') || 'newest'
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100)

    let subs: any[] = []
    try {
      const { data, error } = await adminClient.from('muse_product_subscriptions').select('*').order('created_at', { ascending: false })
      if (!error && data) subs = data
    } catch {}

    let products: any[] = []
    try {
      const { data, error } = await adminClient.from('muse_products').select('id, name, stripe_price_id')
      if (!error && data) products = data
    } catch {}

    const productMap = new Map<string, string>()
    for (const p of products) {
      productMap.set(p.id, p.name)
      if (p.stripe_price_id) productMap.set(p.stripe_price_id, p.name)
    }

    let allUsers: any[] = []
    try {
      let authPage = 1
      while (true) {
        const { data: authData } = await adminClient.auth.admin.listUsers({ page: authPage, perPage: 100 })
        if (!authData?.users || authData.users.length === 0) break
        allUsers = allUsers.concat(authData.users)
        if (authData.users.length < 100) break
        authPage++
      }
    } catch {}

    const userMap = new Map<string, { name: string; email: string }>()
    for (const u of allUsers) {
      userMap.set(u.id, {
        name: u.user_metadata?.display_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown',
        email: u.email || '',
      })
    }

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    let rows: SubscriptionRow[] = subs.map(s => {
      const user = userMap.get(s.user_id) || { name: 'Unknown', email: '' }
      const productName = productMap.get(s.product_id) || productMap.get(s.stripe_price_id) || 'Unknown Product'
      const renewalDate = s.current_period_end || null
      const cancelAtEnd = s.cancel_at_period_end === true
      const isChurnRisk = cancelAtEnd || (renewalDate && new Date(renewalDate) < sevenDaysFromNow && (s.status === 'active' || s.status === 'trialing'))

      return {
        id: s.id,
        user_id: s.user_id,
        user_name: user.name,
        user_email: user.email,
        product_name: productName,
        tier: s.tier_id || 'default',
        status: s.status || 'unknown',
        amount_cents: s.price_amount || 0,
        renewal_date: renewalDate,
        cancel_at_period_end: cancelAtEnd,
        churn_risk: !!isChurnRisk,
        created_at: s.created_at,
        stripe_subscription_id: s.stripe_subscription_id || null,
      }
    })

    if (statusFilter) {
      rows = rows.filter(r => r.status === statusFilter)
    }

    if (tierFilter) {
      rows = rows.filter(r => r.tier.toLowerCase() === tierFilter.toLowerCase())
    }

    if (churnRisk === 'true') {
      rows = rows.filter(r => r.churn_risk)
    }

    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r => r.user_name.toLowerCase().includes(q) || r.user_email.toLowerCase().includes(q))
    }

    switch (sort) {
      case 'oldest':
        rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'amount':
        rows.sort((a, b) => b.amount_cents - a.amount_cents)
        break
      case 'renewal':
        rows.sort((a, b) => {
          if (!a.renewal_date) return 1
          if (!b.renewal_date) return -1
          return new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()
        })
        break
      default:
        rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    const totalActive = rows.filter(r => r.status === 'active' || r.status === 'trialing').length
    const mrr = rows.filter(r => r.status === 'active' || r.status === 'trialing').reduce((s, r) => s + r.amount_cents, 0)
    const churnRiskCount = rows.filter(r => r.churn_risk).length

    const tierBreakdown: Record<string, { count: number; mrr: number }> = {}
    for (const r of rows) {
      if (r.status === 'active' || r.status === 'trialing') {
        if (!tierBreakdown[r.tier]) tierBreakdown[r.tier] = { count: 0, mrr: 0 }
        tierBreakdown[r.tier].count++
        tierBreakdown[r.tier].mrr += r.amount_cents
      }
    }

    const total = rows.length
    const start = (page - 1) * limit
    const paginated = rows.slice(start, start + limit)

    return NextResponse.json({
      subscriptions: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: { totalActive, mrr, churnRiskCount, tierBreakdown },
    })
  } catch (err) {
    console.error('Subscriptions list error:', err)
    return NextResponse.json({ error: 'Failed to load subscriptions' }, { status: 500 })
  }
}
