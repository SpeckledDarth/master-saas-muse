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

    const { data: sub, error } = await adminClient
      .from('muse_product_subscriptions')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    let user = { id: sub.user_id, name: 'Unknown', email: '', avatar_url: null as string | null, last_sign_in_at: null as string | null }
    try {
      const { data: authData } = await adminClient.auth.admin.getUserById(sub.user_id)
      if (authData?.user) {
        user = {
          id: authData.user.id,
          name: authData.user.user_metadata?.display_name || authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'Unknown',
          email: authData.user.email || '',
          avatar_url: authData.user.user_metadata?.avatar_url || null,
          last_sign_in_at: authData.user.last_sign_in_at || null,
        }
      }
    } catch {}

    let product = null
    try {
      if (sub.product_id) {
        const { data } = await adminClient.from('muse_products').select('*').eq('id', sub.product_id).maybeSingle()
        if (data) product = data
      }
    } catch {}

    let invoices: any[] = []
    try {
      if (sub.stripe_subscription_id) {
        const { data } = await adminClient.from('invoices').select('*').eq('stripe_subscription_id', sub.stripe_subscription_id).order('created_at', { ascending: false })
        if (data) invoices = data
      }
    } catch {}

    let stripeCustomerId: string | null = null
    try {
      const { data } = await adminClient.from('stripe_customers').select('stripe_customer_id').eq('user_id', sub.user_id).maybeSingle()
      if (data) stripeCustomerId = data.stripe_customer_id
    } catch {}

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const churnIndicators: string[] = []

    if (sub.cancel_at_period_end) {
      churnIndicators.push('Cancellation pending at period end')
    }

    if (sub.current_period_end && new Date(sub.current_period_end) < sevenDaysFromNow && (sub.status === 'active' || sub.status === 'trialing')) {
      churnIndicators.push('Renewal within 7 days')
    }

    if (sub.status === 'past_due') {
      churnIndicators.push('Payment past due')
    }

    const daysSinceLogin = user.last_sign_in_at
      ? Math.floor((Date.now() - new Date(user.last_sign_in_at).getTime()) / (24 * 60 * 60 * 1000))
      : null

    if (daysSinceLogin !== null && daysSinceLogin > 30) {
      churnIndicators.push(`User inactive for ${daysSinceLogin} days`)
    }

    return NextResponse.json({
      subscription: sub,
      user,
      product,
      invoices,
      stripeCustomerId,
      churnIndicators,
    })
  } catch (err) {
    console.error('Subscription detail error:', err)
    return NextResponse.json({ error: 'Failed to load subscription' }, { status: 500 })
  }
}
