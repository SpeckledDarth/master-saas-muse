import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, isErrorResponse } from '@/lib/admin-auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth
    const { id } = await params

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

    const getUser = (userId: string) => {
      const u = allUsers.find(u => u.id === userId)
      if (!u) return { id: userId, name: 'Unknown', email: '', avatar_url: null }
      return {
        id: u.id,
        name: u.user_metadata?.display_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown',
        email: u.email || '',
        avatar_url: u.user_metadata?.avatar_url || null,
      }
    }

    try {
      const { data: invoice, error } = await adminClient.from('invoices').select('*').eq('id', id).maybeSingle()
      if (!error && invoice) {
        const user = getUser(invoice.user_id)

        let payment = null
        try {
          const { data } = await adminClient.from('payments').select('*').eq('invoice_id', invoice.id).maybeSingle()
          if (data) payment = data
        } catch {}

        let lineItems: any[] = []
        try {
          const { data } = await adminClient.from('invoice_items').select('*').eq('invoice_id', invoice.id)
          if (data) lineItems = data
        } catch {}

        let subscription = null
        try {
          if (invoice.stripe_subscription_id) {
            const { data } = await adminClient.from('muse_product_subscriptions').select('*').eq('stripe_subscription_id', invoice.stripe_subscription_id).maybeSingle()
            if (data) subscription = data
          }
        } catch {}

        let affiliateAttribution = null
        try {
          const { data: commission } = await adminClient.from('affiliate_commissions').select('*').eq('stripe_invoice_id', invoice.stripe_invoice_id || invoice.id).maybeSingle()
          if (commission) {
            const affiliate = getUser(commission.affiliate_user_id)
            affiliateAttribution = {
              affiliate,
              commission_amount: commission.amount_cents,
              commission_rate: commission.commission_rate,
              commission_status: commission.status,
            }
          }
        } catch {}

        return NextResponse.json({
          type: 'invoice',
          record: invoice,
          user,
          payment,
          lineItems,
          subscription,
          affiliateAttribution,
        })
      }
    } catch {}

    try {
      const { data: payment, error } = await adminClient.from('payments').select('*').eq('id', id).maybeSingle()
      if (!error && payment) {
        const user = getUser(payment.user_id)

        let relatedInvoice = null
        try {
          if (payment.invoice_id) {
            const { data } = await adminClient.from('invoices').select('*').eq('id', payment.invoice_id).maybeSingle()
            if (data) relatedInvoice = data
          }
        } catch {}

        return NextResponse.json({
          type: 'payment',
          record: payment,
          user,
          relatedInvoice,
        })
      }
    } catch {}

    try {
      const { data: commission, error } = await adminClient.from('affiliate_commissions').select('*').eq('id', id).maybeSingle()
      if (!error && commission) {
        const affiliate = getUser(commission.affiliate_user_id)

        let relatedInvoice = null
        try {
          if (commission.stripe_invoice_id) {
            const { data } = await adminClient.from('invoices').select('*').eq('stripe_invoice_id', commission.stripe_invoice_id).maybeSingle()
            if (data) relatedInvoice = data
          }
        } catch {}

        let referredCustomer = null
        let referral = null
        try {
          if (commission.referral_id) {
            const { data: ref } = await adminClient.from('affiliate_referrals').select('*').eq('id', commission.referral_id).maybeSingle()
            if (ref) {
              referral = ref
              referredCustomer = getUser(ref.referred_user_id)
            }
          }
        } catch {}

        return NextResponse.json({
          type: 'commission',
          record: commission,
          user: affiliate,
          relatedInvoice,
          referredCustomer,
          referral,
        })
      }
    } catch {}

    try {
      const { data: payout, error } = await adminClient.from('affiliate_payouts').select('*').eq('id', id).maybeSingle()
      if (!error && payout) {
        const affiliate = getUser(payout.affiliate_user_id)

        let includedCommissions: any[] = []
        try {
          const { data } = await adminClient.from('affiliate_payout_items').select('*').eq('payout_id', payout.id)
          if (data) includedCommissions = data
        } catch {}

        let processedBy = null
        if (payout.processed_by) {
          processedBy = getUser(payout.processed_by)
        }

        return NextResponse.json({
          type: 'payout',
          record: payout,
          user: affiliate,
          includedCommissions,
          processedBy,
        })
      }
    } catch {}

    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  } catch (err) {
    console.error('Revenue detail error:', err)
    return NextResponse.json({ error: 'Failed to load transaction' }, { status: 500 })
  }
}
