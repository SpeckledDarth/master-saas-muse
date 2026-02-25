import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function isAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.role === 'admin' || data?.role === 'super_admin'
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminCheck = await isAdmin(user.id)
    if (!adminCheck) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const admin = createAdminClient()

    const { data: renewals, error } = await admin
      .from('commission_renewals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admin renewals:', error)
      return NextResponse.json({ renewals: [] })
    }

    const affiliateIds = [...new Set((renewals || []).map(r => r.affiliate_user_id))]
    let affiliateMap: Record<string, string> = {}

    if (affiliateIds.length > 0) {
      const { data: links } = await admin
        .from('referral_links')
        .select('user_id, ref_code')
        .in('user_id', affiliateIds)

      ;(links || []).forEach((l: any) => {
        affiliateMap[l.user_id] = l.ref_code
      })
    }

    const enrichedRenewals = (renewals || []).map(r => ({
      ...r,
      affiliate_ref_code: affiliateMap[r.affiliate_user_id] || r.affiliate_user_id.slice(0, 8),
    }))

    return NextResponse.json({ renewals: enrichedRenewals })
  } catch (err) {
    console.error('Admin renewals GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminCheck = await isAdmin(user.id)
    if (!adminCheck) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields: id, status' }, { status: 400 })
    }

    if (!['approved', 'denied'].includes(status)) {
      return NextResponse.json({ error: 'Status must be approved or denied' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: renewal, error: fetchError } = await admin
      .from('commission_renewals')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !renewal) {
      return NextResponse.json({ error: 'Renewal request not found' }, { status: 404 })
    }

    if (renewal.status !== 'pending') {
      return NextResponse.json({ error: 'This renewal has already been reviewed' }, { status: 409 })
    }

    const { data: updated, error: updateError } = await admin
      .from('commission_renewals')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating renewal:', updateError)
      return NextResponse.json({ error: 'Failed to update renewal' }, { status: 500 })
    }

    if (status === 'approved') {
      await admin
        .from('affiliate_referrals')
        .update({ commission_end_date: renewal.renewed_end_date })
        .eq('id', renewal.referral_id)
    }

    return NextResponse.json({ renewal: updated })
  } catch (err) {
    console.error('Admin renewals PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
