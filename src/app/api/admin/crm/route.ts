import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, isErrorResponse, safeTableError } from '@/lib/admin-auth'

interface CRMContact {
  id: string
  email: string
  name: string
  avatar_url: string | null
  types: string[]
  plan: string
  total_revenue: number
  status: 'active' | 'inactive'
  last_active: string | null
  health_score: number
  tags: { tag: string; color: string }[]
  member_since: string
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth

    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const typeFilter = url.searchParams.get('type') || ''
    const planFilter = url.searchParams.get('plan') || ''
    const statusFilter = url.searchParams.get('status') || ''
    const tagFilter = url.searchParams.get('tag') || ''
    const sort = url.searchParams.get('sort') || 'newest'
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100)

    let allUsers: any[] = []
    let authPage = 1
    const perPage = 100

    while (true) {
      const { data: authData } = await adminClient.auth.admin.listUsers({ page: authPage, perPage })
      if (!authData?.users || authData.users.length === 0) break
      allUsers = allUsers.concat(authData.users)
      if (authData.users.length < perPage) break
      authPage++
    }

    if (search) {
      const q = search.toLowerCase()
      allUsers = allUsers.filter(u => {
        const name = (u.user_metadata?.display_name || u.user_metadata?.full_name || '').toLowerCase()
        const email = (u.email || '').toLowerCase()
        return name.includes(q) || email.includes(q)
      })
    }

    let subscriptions: any[] = []
    let affiliateProfiles: any[] = []
    let orgMembers: any[] = []
    let invoices: any[] = []
    let tags: any[] = []
    let activities: any[] = []

    try {
      const { data, error } = await adminClient.from('muse_product_subscriptions').select('user_id, status, tier_id')
      if (!error && data) subscriptions = data
    } catch {}

    try {
      const { data, error } = await adminClient.from('affiliate_profiles').select('user_id')
      if (!error && data) affiliateProfiles = data
    } catch {}

    try {
      const { data, error } = await adminClient.from('organization_members').select('user_id, role')
      if (!error && data) orgMembers = data
    } catch {}

    try {
      const { data, error } = await adminClient.from('invoices').select('id, user_id, amount_paid_cents, status')
      if (!error && data) invoices = data
    } catch {}

    try {
      const { data, error } = await adminClient.from('user_tags').select('user_id, tag, color')
      if (!error && data) tags = data
    } catch {}

    try {
      const { data, error } = await adminClient.from('activities').select('user_id, created_at').order('created_at', { ascending: false }).limit(5000)
      if (!error && data) activities = data
    } catch {}

    const subByUser = new Map<string, any[]>()
    for (const s of subscriptions) {
      if (!subByUser.has(s.user_id)) subByUser.set(s.user_id, [])
      subByUser.get(s.user_id)!.push(s)
    }

    const affiliateSet = new Set(affiliateProfiles.map(a => a.user_id))
    const orgMemberSet = new Map(orgMembers.map(m => [m.user_id, m.role]))

    const invoiceIds = new Set(invoices.map((inv: any) => inv.id).filter(Boolean))
    const revenueByUser = new Map<string, number>()
    for (const inv of invoices) {
      if ((inv.status === 'paid' || inv.status === 'succeeded') && inv.user_id) {
        revenueByUser.set(inv.user_id, (revenueByUser.get(inv.user_id) || 0) + (inv.amount_paid_cents || 0))
      }
    }

    let payments: any[] = []
    try {
      const { data, error } = await adminClient.from('payments').select('user_id, amount_cents, status, invoice_id')
      if (!error && data) payments = data
    } catch {}
    for (const p of payments) {
      if (p.status === 'succeeded' && p.user_id && (!p.invoice_id || !invoiceIds.has(p.invoice_id))) {
        revenueByUser.set(p.user_id, (revenueByUser.get(p.user_id) || 0) + (p.amount_cents || 0))
      }
    }

    const tagsByUser = new Map<string, { tag: string; color: string }[]>()
    for (const t of tags) {
      if (!tagsByUser.has(t.user_id)) tagsByUser.set(t.user_id, [])
      tagsByUser.get(t.user_id)!.push({ tag: t.tag, color: t.color })
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const activityCountByUser = new Map<string, number>()
    for (const a of activities) {
      if (new Date(a.created_at) >= thirtyDaysAgo) {
        activityCountByUser.set(a.user_id, (activityCountByUser.get(a.user_id) || 0) + 1)
      }
    }

    const now = Date.now()
    let contacts: CRMContact[] = allUsers.map(u => {
      const userSubs = subByUser.get(u.id) || []
      const activeSub = userSubs.find(s => s.status === 'active' || s.status === 'trialing')
      const isAffiliate = affiliateSet.has(u.id)
      const teamRole = orgMemberSet.get(u.id)

      const types: string[] = []
      if (activeSub) types.push('Subscriber')
      if (isAffiliate) types.push('Affiliate')
      if (teamRole) types.push('Team')

      const plan = activeSub?.tier_id || (activeSub ? 'active' : 'free')
      const totalRevenue = revenueByUser.get(u.id) || 0
      const lastSignIn = u.last_sign_in_at
      const isActive = lastSignIn ? (now - new Date(lastSignIn).getTime()) < 30 * 24 * 60 * 60 * 1000 : false
      const userTags = tagsByUser.get(u.id) || []

      const daysSinceLogin = lastSignIn ? (now - new Date(lastSignIn).getTime()) / (24 * 60 * 60 * 1000) : 999
      const loginScore = Math.max(0, 40 - (daysSinceLogin / 30) * 40)
      const subScore = activeSub ? 30 : 0
      const activityCount = activityCountByUser.get(u.id) || 0
      const activityScore = Math.min(30, activityCount)
      const healthScore = Math.round(loginScore + subScore + activityScore)

      return {
        id: u.id,
        email: u.email || '',
        name: u.user_metadata?.display_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown',
        avatar_url: u.user_metadata?.avatar_url || null,
        types,
        plan,
        total_revenue: totalRevenue,
        status: isActive ? 'active' as const : 'inactive' as const,
        last_active: lastSignIn || null,
        health_score: healthScore,
        tags: userTags,
        member_since: u.created_at,
      }
    })

    if (typeFilter) {
      contacts = contacts.filter(c => c.types.some(t => t.toLowerCase() === typeFilter.toLowerCase()))
    }

    if (planFilter) {
      contacts = contacts.filter(c => c.plan.toLowerCase() === planFilter.toLowerCase())
    }

    if (statusFilter) {
      contacts = contacts.filter(c => c.status === statusFilter)
    }

    if (tagFilter) {
      contacts = contacts.filter(c => c.tags.some(t => t.tag.toLowerCase() === tagFilter.toLowerCase()))
    }

    switch (sort) {
      case 'newest':
        contacts.sort((a, b) => new Date(b.member_since).getTime() - new Date(a.member_since).getTime())
        break
      case 'oldest':
        contacts.sort((a, b) => new Date(a.member_since).getTime() - new Date(b.member_since).getTime())
        break
      case 'revenue':
        contacts.sort((a, b) => b.total_revenue - a.total_revenue)
        break
      case 'health':
        contacts.sort((a, b) => b.health_score - a.health_score)
        break
      case 'name':
        contacts.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        contacts.sort((a, b) => new Date(b.member_since).getTime() - new Date(a.member_since).getTime())
    }

    const total = contacts.length
    const start = (page - 1) * limit
    const paginated = contacts.slice(start, start + limit)

    return NextResponse.json({
      contacts: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('CRM list error:', err)
    return NextResponse.json({ error: 'Failed to load contacts' }, { status: 500 })
  }
}
