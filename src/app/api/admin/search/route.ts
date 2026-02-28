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

    // --- User search via user_profiles + auth.users (DB-level, no full scan) ---
    try {
      const { data: profiles } = await adminClient
        .from('user_profiles')
        .select('user_id, display_name')
        .ilike('display_name', `%${q}%`)
        .limit(10)

      const profileUserIds = new Set((profiles || []).map((p: any) => p.user_id))
      const profileMap = new Map<string, string>()
      for (const p of profiles || []) {
        profileMap.set(p.user_id, p.display_name || '')
      }

      let authMatches: any[] = []
      try {
        const { data: authData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 50 })
        if (authData?.users) {
          authMatches = authData.users.filter((u: any) => {
            const email = (u.email || '').toLowerCase()
            return email.includes(q)
          })
        }
      } catch {}

      const seen = new Set<string>()

      for (const u of authMatches.slice(0, 5)) {
        seen.add(u.id)
        const profileName = profileMap.get(u.id)
        const displayName = profileName || u.user_metadata?.display_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown'
        results.push({
          type: 'user',
          title: displayName,
          subtitle: u.email || '',
          href: `/admin/crm/${u.id}`,
        })
      }

      if (profiles && profiles.length > 0) {
        const profileUserIdsToResolve = (profiles as any[])
          .filter((p: any) => !seen.has(p.user_id))
          .map((p: any) => p.user_id)
          .slice(0, 5)

        if (profileUserIdsToResolve.length > 0) {
          let resolvedUsers: any[] = []
          try {
            const { data: authData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 })
            if (authData?.users) {
              const idSet = new Set(profileUserIdsToResolve)
              resolvedUsers = authData.users.filter((u: any) => idSet.has(u.id))
            }
          } catch {}

          const emailMap = new Map<string, string>()
          for (const u of resolvedUsers) {
            emailMap.set(u.id, u.email || '')
          }

          for (const userId of profileUserIdsToResolve) {
            if (seen.has(userId)) continue
            seen.add(userId)
            const displayName = profileMap.get(userId) || 'Unknown'
            const email = emailMap.get(userId) || ''
            results.push({
              type: 'user',
              title: displayName,
              subtitle: email,
              href: `/admin/crm/${userId}`,
            })
            if (results.filter(r => r.type === 'user').length >= 5) break
          }
        }
      }
    } catch {}

    // --- Build a user lookup map for enriching invoice/subscription results ---
    const userIdsToResolve = new Set<string>()

    let invoiceData: any[] = []
    let subsData: any[] = []

    // --- Invoice search ---
    try {
      const { data, error } = await adminClient
        .from('invoices')
        .select('id, stripe_invoice_id, invoice_number, amount_paid_cents, amount_due_cents, status, user_id')
        .or(`stripe_invoice_id.ilike.%${q}%,invoice_number.ilike.%${q}%`)
        .limit(5)

      if (!error && data) {
        invoiceData = data
        for (const inv of data) {
          if (inv.user_id) userIdsToResolve.add(inv.user_id)
        }
      }
    } catch {}

    // --- Subscription search ---
    try {
      const { data: subs, error } = await adminClient
        .from('muse_product_subscriptions')
        .select('id, user_id, tier_id, status, stripe_subscription_id')
        .or(`stripe_subscription_id.ilike.%${q}%,tier_id.ilike.%${q}%,status.ilike.%${q}%`)
        .limit(5)

      if (!error && subs) {
        subsData = subs
        for (const s of subs) {
          if (s.user_id) userIdsToResolve.add(s.user_id)
        }
      }
    } catch {}

    // --- Resolve user names for invoices and subscriptions ---
    const userNameMap = new Map<string, { name: string; email: string }>()
    if (userIdsToResolve.size > 0) {
      try {
        const userIds = Array.from(userIdsToResolve)
        const { data: profiles } = await adminClient
          .from('user_profiles')
          .select('user_id, display_name')
          .in('user_id', userIds)

        if (profiles) {
          for (const p of profiles as any[]) {
            userNameMap.set(p.user_id, { name: p.display_name || '', email: '' })
          }
        }

        try {
          const { data: authData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 })
          if (authData?.users) {
            for (const u of authData.users) {
              if (userIdsToResolve.has(u.id)) {
                const existing = userNameMap.get(u.id)
                userNameMap.set(u.id, {
                  name: existing?.name || u.user_metadata?.display_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown',
                  email: u.email || '',
                })
              }
            }
          }
        } catch {}
      } catch {}
    }

    // --- Format invoice results with user names ---
    for (const inv of invoiceData) {
      const userInfo = userNameMap.get(inv.user_id)
      const userName = userInfo?.name || ''
      const invoiceLabel = inv.invoice_number || inv.stripe_invoice_id || inv.id
      results.push({
        type: 'invoice',
        title: userName ? `Invoice ${invoiceLabel} — ${userName}` : `Invoice ${invoiceLabel}`,
        subtitle: `${formatCurrency(inv.amount_paid_cents || inv.amount_due_cents || 0)} · ${inv.status}`,
        href: `/admin/revenue/${inv.id}`,
      })
    }

    // --- Format subscription results with user names ---
    for (const s of subsData) {
      const userInfo = userNameMap.get(s.user_id)
      const name = userInfo?.name || 'Unknown'
      results.push({
        type: 'subscription',
        title: `${name} — ${s.tier_id || 'Default'} Plan`,
        subtitle: `${s.status} · ${s.stripe_subscription_id || s.id}`,
        href: `/admin/subscriptions/${s.id}`,
      })
    }

    // --- Ticket search ---
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
