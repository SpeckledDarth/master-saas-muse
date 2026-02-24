import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function verifyAdmin(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()
    if (data?.role === 'admin') return true

    const { data: teamData } = await admin
      .from('team_members')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'owner'])
      .maybeSingle()
    return !!teamData
  } catch {
    return false
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const isAdmin = await verifyAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const { userId } = await params
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const admin = createAdminClient()

    const safe = async <T>(fn: () => Promise<{ data: T | null }>): Promise<T | null> => {
      try { const r = await fn(); return r.data; } catch { return null; }
    }

    const [profileRes, codesRes, transactionsRes, commissionsRes, payoutsRes, referralsRes, auditRes] = await Promise.all([
      safe(() => admin.from('affiliate_profiles').select('*').eq('user_id', userId).maybeSingle()),
      safe(() => admin.from('affiliate_discount_codes').select('*').eq('affiliate_user_id', userId).order('created_at', { ascending: false })),
      safe(() => admin.from('affiliate_transactions').select('*').eq('affiliate_user_id', userId).order('created_at', { ascending: false }).limit(20)),
      safe(() => admin.from('affiliate_commissions').select('*').eq('affiliate_user_id', userId).order('created_at', { ascending: false }).limit(20)),
      safe(() => admin.from('affiliate_payouts').select('*').eq('affiliate_user_id', userId).order('created_at', { ascending: false }).limit(10)),
      safe(() => admin.from('affiliate_referrals').select('*').eq('affiliate_user_id', userId).order('created_at', { ascending: false }).limit(20)),
      safe(() => admin.from('audit_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)),
    ])

    return NextResponse.json({
      profile: profileRes,
      discountCodes: codesRes,
      transactions: transactionsRes,
      commissions: commissionsRes,
      payouts: payoutsRes,
      referrals: referralsRes,
      auditLogs: auditRes,
    })
  } catch (err) {
    console.error('Admin affiliate detail error:', err)
    return NextResponse.json({ error: 'Failed to load affiliate detail' }, { status: 500 })
  }
}
