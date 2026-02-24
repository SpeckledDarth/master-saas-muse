import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { data, error } = await admin
      .from('affiliate_tax_info')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        return NextResponse.json({ submissions: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const userIds = (data || []).map((d: any) => d.affiliate_user_id).filter(Boolean)
    let emailMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: links } = await admin
        .from('referral_links')
        .select('user_id, ref_code')
        .in('user_id', userIds)

      if (links) {
        for (const link of links) {
          emailMap[link.user_id] = link.ref_code
        }
      }
    }

    const submissions = (data || []).map((d: any) => ({
      ...d,
      ref_code: emailMap[d.affiliate_user_id] || null,
    }))

    return NextResponse.json({ submissions })
  } catch (err) {
    console.error('Admin tax info GET error:', err)
    return NextResponse.json({ error: 'Failed to load tax submissions' }, { status: 500 })
  }
}
