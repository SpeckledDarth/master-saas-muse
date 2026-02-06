import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUncachableStripeClient } from '@/lib/stripe/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .maybeSingle()

    const { data: teamMember } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('user_id', currentUser.id)
      .eq('organization_id', 1)
      .maybeSingle()

    const isAdmin = userRole?.role === 'admin'
    const canAccess = isAdmin || teamMember?.role === 'owner' || teamMember?.role === 'manager'

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, email, full_name, stripe_customer_id, stripe_subscription_id, avatar_url, created_at')
      .eq('id', userId)
      .maybeSingle()

    let authUser: any = null
    try {
      const { data } = await adminClient.auth.admin.getUserById(userId)
      authUser = data?.user || null
    } catch (err) {
      console.error('Could not fetch auth user:', err)
    }

    if (!profile && !authUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const email = profile?.email || authUser?.email || 'Unknown'
    const name = profile?.full_name || authUser?.user_metadata?.full_name || authUser?.user_metadata?.display_name || null
    const avatarUrl = profile?.avatar_url || authUser?.user_metadata?.avatar_url || null
    const provider = authUser?.app_metadata?.provider || 'email'
    const createdAt = profile?.created_at || authUser?.created_at || null
    const lastSignInAt = authUser?.last_sign_in_at || null
    const emailConfirmedAt = authUser?.email_confirmed_at || null
    const stripeCustomerId = profile?.stripe_customer_id || null

    let subscription: any = null
    let invoices: any[] = []
    let stripePortalUrl: string | null = null

    if (stripeCustomerId) {
      try {
        const stripe = await getUncachableStripeClient()

        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: 'all',
          limit: 1,
        })

        if (subscriptions.data.length > 0) {
          const sub = subscriptions.data[0]
          const price = sub.items.data[0]?.price
          const amount = price?.unit_amount || 0
          let tier = 'free'
          if (amount >= 9900) tier = 'team'
          else if (amount >= 2900) tier = 'pro'

          subscription = {
            status: sub.status,
            tier,
            planName: price?.nickname || price?.product?.toString() || null,
            amount,
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: (sub as any).cancel_at_period_end,
            subscriptionId: sub.id,
          }
        }

        const invoiceList = await stripe.invoices.list({
          customer: stripeCustomerId,
          limit: 10,
        })

        invoices = invoiceList.data.map((inv) => ({
          id: inv.id,
          amount_paid: inv.amount_paid,
          status: inv.status,
          created: new Date((inv as any).created * 1000).toISOString(),
          invoice_url: inv.invoice_pdf || null,
          hosted_invoice_url: inv.hosted_invoice_url || null,
        }))

        const returnUrl = new URL(request.url).origin + '/admin/users'
        try {
          const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: returnUrl,
          })
          stripePortalUrl = portalSession.url
        } catch (portalErr) {
          console.error('Could not create portal session:', portalErr)
        }
      } catch (stripeErr) {
        console.error('Error fetching Stripe data:', stripeErr)
      }
    }

    let notes: any[] = []
    try {
      const { data: adminNotes, error: notesError } = await adminClient
        .from('admin_notes')
        .select('id, note, created_by, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!notesError && adminNotes) {
        const creatorIds = [...new Set(adminNotes.map((n: any) => n.created_by).filter(Boolean))]
        const emailMap = new Map<string, string>()

        if (creatorIds.length > 0) {
          for (const creatorId of creatorIds) {
            try {
              const { data: creatorData } = await adminClient.auth.admin.getUserById(creatorId as string)
              if (creatorData?.user?.email) {
                emailMap.set(creatorId as string, creatorData.user.email)
              }
            } catch {}
          }
        }

        notes = adminNotes.map((n: any) => ({
          id: n.id,
          note: n.note,
          created_by_email: emailMap.get(n.created_by) || n.created_by || 'Unknown',
          created_at: n.created_at,
        }))
      }
    } catch {
      notes = []
    }

    return NextResponse.json({
      user: {
        id: userId,
        email,
        name,
        avatar_url: avatarUrl,
        provider,
        created_at: createdAt,
        last_sign_in_at: lastSignInAt,
        email_confirmed_at: emailConfirmedAt,
      },
      subscription: subscription || {
        status: 'free',
        tier: 'free',
        planName: null,
        amount: 0,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        subscriptionId: null,
      },
      invoices,
      notes,
      stripeCustomerId,
      stripePortalUrl,
    })
  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 })
  }
}
