import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ role: null })
    }

    const admin = createAdminClient()

    const [roleRes, memberRes, subRes] = await Promise.all([
      admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
      admin.from('organization_members').select('role').eq('user_id', user.id).limit(1).maybeSingle(),
      admin.from('subscriptions').select('status').eq('user_id', user.id).in('status', ['active', 'trialing']).limit(1).maybeSingle(),
    ])

    return NextResponse.json({
      role: roleRes.data?.role || 'user',
      isTeamMember: !!memberRes.data,
      hasActiveSubscription: !!subRes.data,
    })
  } catch {
    return NextResponse.json({ role: 'user', isTeamMember: false, hasActiveSubscription: false })
  }
}
