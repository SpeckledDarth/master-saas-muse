import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, isErrorResponse } from '@/lib/admin-auth'

interface RelatedRecord {
  type: string
  id: string
  title: string
  subtitle: string
  href: string
}

interface RelatedGroup {
  label: string
  records: RelatedRecord[]
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth

    const url = new URL(request.url)
    const entityType = url.searchParams.get('entityType')
    const entityId = url.searchParams.get('entityId')
    const userId = url.searchParams.get('userId') || ''

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId required' }, { status: 400 })
    }

    const groups: RelatedGroup[] = []

    const getUserName = async (uid: string): Promise<string> => {
      try {
        const { data } = await adminClient.auth.admin.getUserById(uid)
        if (data?.user) {
          return data.user.user_metadata?.display_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Unknown'
        }
      } catch {}
      return 'Unknown'
    }

    const formatCurrency = (cents: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)

    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    if (entityType === 'invoice' && userId) {
      try {
        const { data, error } = await adminClient
          .from('invoices')
          .select('id, stripe_invoice_id, invoice_number, amount_paid_cents, amount_due_cents, status, created_at')
          .eq('user_id', userId)
          .neq('id', entityId)
          .order('created_at', { ascending: false })
          .limit(5)

        if (!error && data && data.length > 0) {
          groups.push({
            label: 'Other Invoices from This Customer',
            records: data.map(inv => ({
              type: 'invoice',
              id: inv.id,
              title: `Invoice ${inv.stripe_invoice_id || inv.invoice_number || inv.id}`,
              subtitle: `${formatCurrency(inv.amount_paid_cents || inv.amount_due_cents || 0)} · ${inv.status} · ${formatDate(inv.created_at)}`,
              href: `/admin/revenue/${inv.id}`,
            })),
          })
        }
      } catch {}

      try {
        const { data, error } = await adminClient
          .from('muse_product_subscriptions')
          .select('id, tier_id, status, stripe_subscription_id')
          .eq('user_id', userId)
          .limit(3)

        if (!error && data && data.length > 0) {
          groups.push({
            label: "Customer's Subscriptions",
            records: data.map(s => ({
              type: 'subscription',
              id: s.id,
              title: `${s.tier_id || 'Default'} Plan`,
              subtitle: s.status,
              href: `/admin/subscriptions/${s.id}`,
            })),
          })
        }
      } catch {}

      try {
        const { data, error } = await adminClient
          .from('support_tickets')
          .select('id, subject, status, ticket_number')
          .eq('user_id', userId)
          .in('status', ['open', 'pending', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(3)

        if (!error && data && data.length > 0) {
          groups.push({
            label: "Customer's Open Tickets",
            records: data.map(t => ({
              type: 'ticket',
              id: t.id,
              title: t.subject || `Ticket #${t.ticket_number || t.id}`,
              subtitle: t.status,
              href: `/admin/feedback/${t.id}`,
            })),
          })
        }
      } catch {}
    }

    if (entityType === 'subscription' && userId) {
      try {
        const { data, error } = await adminClient
          .from('muse_product_subscriptions')
          .select('id, tier_id, status, stripe_subscription_id')
          .eq('user_id', userId)
          .neq('id', entityId)
          .limit(5)

        if (!error && data && data.length > 0) {
          groups.push({
            label: 'Other Subscriptions by This Customer',
            records: data.map(s => ({
              type: 'subscription',
              id: s.id,
              title: `${s.tier_id || 'Default'} Plan`,
              subtitle: s.status,
              href: `/admin/subscriptions/${s.id}`,
            })),
          })
        }
      } catch {}

      try {
        const { data, error } = await adminClient
          .from('invoices')
          .select('id, stripe_invoice_id, invoice_number, amount_paid_cents, amount_due_cents, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)

        if (!error && data && data.length > 0) {
          groups.push({
            label: 'Recent Invoices',
            records: data.map(inv => ({
              type: 'invoice',
              id: inv.id,
              title: `Invoice ${inv.stripe_invoice_id || inv.invoice_number || inv.id}`,
              subtitle: `${formatCurrency(inv.amount_paid_cents || inv.amount_due_cents || 0)} · ${inv.status}`,
              href: `/admin/revenue/${inv.id}`,
            })),
          })
        }
      } catch {}

      try {
        const { data, error } = await adminClient
          .from('support_tickets')
          .select('id, subject, status, ticket_number')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3)

        if (!error && data && data.length > 0) {
          groups.push({
            label: "Customer's Tickets",
            records: data.map(t => ({
              type: 'ticket',
              id: t.id,
              title: t.subject || `Ticket #${t.ticket_number || t.id}`,
              subtitle: t.status,
              href: `/admin/feedback/${t.id}`,
            })),
          })
        }
      } catch {}
    }

    if (entityType === 'commission' && userId) {
      try {
        const { data, error } = await adminClient
          .from('affiliate_commissions')
          .select('id, amount_cents, status, created_at')
          .eq('affiliate_user_id', userId)
          .neq('id', entityId)
          .order('created_at', { ascending: false })
          .limit(5)

        if (!error && data && data.length > 0) {
          groups.push({
            label: 'Other Commissions by This Affiliate',
            records: data.map(c => ({
              type: 'commission',
              id: c.id,
              title: `Commission — ${formatCurrency(c.amount_cents || 0)}`,
              subtitle: `${c.status} · ${formatDate(c.created_at)}`,
              href: `/admin/revenue/${c.id}`,
            })),
          })
        }
      } catch {}

      try {
        const { data, error } = await adminClient
          .from('affiliate_referrals')
          .select('id, referred_user_id, status, created_at')
          .eq('affiliate_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)

        if (!error && data && data.length > 0) {
          const records: RelatedRecord[] = []
          for (const r of data) {
            const name = await getUserName(r.referred_user_id)
            records.push({
              type: 'referral',
              id: r.id,
              title: `Referral — ${name}`,
              subtitle: `${r.status} · ${formatDate(r.created_at)}`,
              href: `/admin/crm/${r.referred_user_id}`,
            })
          }
          groups.push({ label: "Affiliate's Referrals", records })
        }
      } catch {}
    }

    if (entityType === 'payout' && userId) {
      try {
        const { data, error } = await adminClient
          .from('affiliate_commissions')
          .select('id, amount_cents, status, created_at')
          .eq('affiliate_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)

        if (!error && data && data.length > 0) {
          groups.push({
            label: "Affiliate's Commissions",
            records: data.map(c => ({
              type: 'commission',
              id: c.id,
              title: `Commission — ${formatCurrency(c.amount_cents || 0)}`,
              subtitle: `${c.status} · ${formatDate(c.created_at)}`,
              href: `/admin/revenue/${c.id}`,
            })),
          })
        }
      } catch {}

      try {
        const { data, error } = await adminClient
          .from('affiliate_referrals')
          .select('id, referred_user_id, status, created_at')
          .eq('affiliate_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)

        if (!error && data && data.length > 0) {
          const records: RelatedRecord[] = []
          for (const r of data) {
            const name = await getUserName(r.referred_user_id)
            records.push({
              type: 'referral',
              id: r.id,
              title: `Referral — ${name}`,
              subtitle: `${r.status} · ${formatDate(r.created_at)}`,
              href: `/admin/crm/${r.referred_user_id}`,
            })
          }
          groups.push({ label: "Affiliate's Referrals", records })
        }
      } catch {}
    }

    return NextResponse.json({ groups })
  } catch (err) {
    console.error('Related records error:', err)
    return NextResponse.json({ error: 'Failed to load related records' }, { status: 500 })
  }
}
