import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, isErrorResponse } from '@/lib/admin-auth'

interface Transaction {
  id: string
  type: 'invoice' | 'payment' | 'commission' | 'payout'
  description: string
  user_id: string
  user_name: string
  user_email: string
  amount_cents: number
  status: string
  date: string
  meta: Record<string, any>
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth

    const url = new URL(request.url)
    const typeFilter = url.searchParams.get('type') || ''
    const statusFilter = url.searchParams.get('status') || ''
    const dateFrom = url.searchParams.get('dateFrom') || ''
    const dateTo = url.searchParams.get('dateTo') || ''
    const search = url.searchParams.get('search') || ''
    const sort = url.searchParams.get('sort') || 'date_desc'
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100)

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

    let transactions: Transaction[] = []

    if (!typeFilter || typeFilter === 'invoice') {
      try {
        const { data, error } = await adminClient.from('invoices').select('*').order('created_at', { ascending: false })
        if (!error && data) {
          for (const inv of data) {
            const user = userMap.get(inv.user_id) || { name: 'Unknown', email: '' }
            transactions.push({
              id: inv.id,
              type: 'invoice',
              description: `Invoice ${inv.stripe_invoice_id || inv.invoice_number || inv.id}`,
              user_id: inv.user_id,
              user_name: user.name,
              user_email: user.email,
              amount_cents: inv.amount_paid_cents || inv.amount_due_cents || 0,
              status: inv.status || 'unknown',
              date: inv.created_at,
              meta: { stripe_invoice_id: inv.stripe_invoice_id, period_start: inv.period_start, period_end: inv.period_end },
            })
          }
        }
      } catch {}
    }

    if (!typeFilter || typeFilter === 'payment') {
      try {
        const { data, error } = await adminClient.from('payments').select('*').order('created_at', { ascending: false })
        if (!error && data) {
          for (const p of data) {
            const user = userMap.get(p.user_id) || { name: 'Unknown', email: '' }
            transactions.push({
              id: p.id,
              type: 'payment',
              description: `Payment ${p.stripe_payment_intent_id || p.id}`,
              user_id: p.user_id,
              user_name: user.name,
              user_email: user.email,
              amount_cents: p.amount_cents || 0,
              status: p.status || 'unknown',
              date: p.created_at,
              meta: { card_brand: p.card_brand, card_last4: p.card_last4, invoice_id: p.invoice_id },
            })
          }
        }
      } catch {}
    }

    if (!typeFilter || typeFilter === 'commission') {
      try {
        const { data, error } = await adminClient.from('affiliate_commissions').select('*').order('created_at', { ascending: false })
        if (!error && data) {
          for (const c of data) {
            const user = userMap.get(c.affiliate_user_id) || { name: 'Unknown', email: '' }
            transactions.push({
              id: c.id,
              type: 'commission',
              description: `Commission`,
              user_id: c.affiliate_user_id,
              user_name: user.name,
              user_email: user.email,
              amount_cents: c.amount_cents || 0,
              status: c.status || 'pending',
              date: c.created_at,
              meta: { commission_rate: c.commission_rate, referral_id: c.referral_id, stripe_invoice_id: c.stripe_invoice_id },
            })
          }
        }
      } catch {}
    }

    if (!typeFilter || typeFilter === 'payout') {
      try {
        const { data, error } = await adminClient.from('affiliate_payouts').select('*').order('created_at', { ascending: false })
        if (!error && data) {
          for (const p of data) {
            const user = userMap.get(p.affiliate_user_id) || { name: 'Unknown', email: '' }
            transactions.push({
              id: p.id,
              type: 'payout',
              description: `Payout`,
              user_id: p.affiliate_user_id,
              user_name: user.name,
              user_email: user.email,
              amount_cents: p.amount_cents || 0,
              status: p.status || 'pending',
              date: p.created_at,
              meta: { method: p.method || p.payout_method, processed_by: p.processed_by },
            })
          }
        }
      } catch {}
    }

    if (statusFilter) {
      transactions = transactions.filter(t => t.status === statusFilter)
    }

    if (dateFrom) {
      const from = new Date(dateFrom)
      transactions = transactions.filter(t => new Date(t.date) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      transactions = transactions.filter(t => new Date(t.date) <= to)
    }

    if (search) {
      const q = search.toLowerCase()
      transactions = transactions.filter(t =>
        t.user_name.toLowerCase().includes(q) ||
        t.user_email.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      )
    }

    switch (sort) {
      case 'date_asc':
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        break
      case 'amount_desc':
        transactions.sort((a, b) => b.amount_cents - a.amount_cents)
        break
      case 'amount_asc':
        transactions.sort((a, b) => a.amount_cents - b.amount_cents)
        break
      default:
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    const totalRevenue = transactions.filter(t => t.type === 'invoice' && t.status === 'paid').reduce((s, t) => s + t.amount_cents, 0)
    const pendingCommissions = transactions.filter(t => t.type === 'commission' && t.status === 'pending').reduce((s, t) => s + t.amount_cents, 0)
    const outstandingPayouts = transactions.filter(t => t.type === 'payout' && (t.status === 'pending' || t.status === 'processing')).reduce((s, t) => s + t.amount_cents, 0)

    const total = transactions.length
    const start = (page - 1) * limit
    const paginated = transactions.slice(start, start + limit)

    return NextResponse.json({
      transactions: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: { totalRevenue, pendingCommissions, outstandingPayouts },
    })
  } catch (err) {
    console.error('Revenue list error:', err)
    return NextResponse.json({ error: 'Failed to load revenue data' }, { status: 500 })
  }
}
