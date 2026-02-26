import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, isErrorResponse } from '@/lib/admin-auth'

interface SearchResult {
  type: 'user' | 'invoice' | 'subscription' | 'ticket'
  title: string
  subtitle: string
  href: string
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth

    const q = new URL(request.url).searchParams.get('q')?.trim().toLowerCase()
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const results: SearchResult[] = []

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

    const userMap = new Map<string, any>()
    for (const u of allUsers) userMap.set(u.id, u)

    try {
      const matched = allUsers
        .filter(u => {
          const name = (u.user_metadata?.display_name || u.user_metadata?.full_name || '').toLowerCase()
          const email = (u.email || '').toLowerCase()
          return name.includes(q) || email.includes(q)
        })
        .slice(0, 5)

      for (const u of matched) {
        results.push({
          type: 'user',
          title: u.user_metadata?.display_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown',
          subtitle: u.email || '',
          href: `/admin/crm/${u.id}`,
        })
      }
    } catch {}

    try {
      const { data, error } = await adminClient
        .from('invoices')
        .select('id, stripe_invoice_id, invoice_number, amount_paid_cents, amount_due_cents, status, user_id')
        .or(`stripe_invoice_id.ilike.%${q}%,invoice_number.ilike.%${q}%`)
        .limit(5)

      if (!error && data) {
        for (const inv of data) {
          results.push({
            type: 'invoice',
            title: `Invoice ${inv.stripe_invoice_id || inv.invoice_number || inv.id}`,
            subtitle: `${formatCurrency(inv.amount_paid_cents || inv.amount_due_cents || 0)} · ${inv.status}`,
            href: `/admin/revenue/${inv.id}`,
          })
        }
      }
    } catch {}

    try {
      const { data: subs, error } = await adminClient
        .from('muse_product_subscriptions')
        .select('id, user_id, tier_id, status, stripe_subscription_id')
        .or(`stripe_subscription_id.ilike.%${q}%,tier_id.ilike.%${q}%`)
        .limit(5)

      if (!error && subs) {
        for (const s of subs) {
          const user = userMap.get(s.user_id)
          const name = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown'
          results.push({
            type: 'subscription',
            title: `${name} — ${s.tier_id || 'Default'} Plan`,
            subtitle: `${s.status} · ${s.stripe_subscription_id || s.id}`,
            href: `/admin/subscriptions/${s.id}`,
          })
        }
      }
    } catch {}

    try {
      const { data, error } = await adminClient
        .from('support_tickets')
        .select('id, subject, status, ticket_number')
        .or(`subject.ilike.%${q}%,ticket_number.ilike.%${q}%`)
        .limit(5)

      if (!error && data) {
        for (const t of data) {
          results.push({
            type: 'ticket',
            title: t.subject || `Ticket #${t.ticket_number || t.id}`,
            subtitle: t.status || 'open',
            href: `/admin/feedback/${t.id}`,
          })
        }
      }
    } catch {}

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Search API error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}
