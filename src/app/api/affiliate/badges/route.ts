import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndAwardBadges } from '@/lib/affiliate/badges'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    await checkAndAwardBadges(user.id)

    const { data: badges, error } = await admin
      .from('affiliate_badges')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .eq('is_active', true)
      .order('threshold_cents', { ascending: true })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        return NextResponse.json({ badges: [], tiers: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: tiers } = await admin
      .from('affiliate_badge_tiers')
      .select('*')
      .order('sort_order', { ascending: true })

    return NextResponse.json({
      badges: badges || [],
      tiers: tiers || [],
    })
  } catch (err) {
    console.error('Badges GET error:', err)
    return NextResponse.json({ error: 'Failed to load badges' }, { status: 500 })
  }
}
