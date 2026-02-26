import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ hasAdminAccess: false, isAppAdmin: false, isAffiliate: false, userRole: 'user', teamRole: null })
    }

    const adminClient = createAdminClient()

    const [roleResult, memberResult, affiliateResult] = await Promise.all([
      adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle(),
      adminClient
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', 1)
        .order('joined_at', { ascending: false })
        .limit(1),
      adminClient
        .from('affiliate_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    const userRole = roleResult.data?.role || 'user'
    const isAppAdmin = userRole === 'admin'
    const isAffiliate = userRole === 'affiliate' || !!affiliateResult.data

    if (memberResult.error) {
      console.error('[Membership API] Error fetching member:', memberResult.error)
    }
    
    const teamRole = memberResult.data?.[0]?.role
    const hasTeamAccess = teamRole === 'owner' || teamRole === 'manager' || teamRole === 'member'
    
    return NextResponse.json({ 
      hasAdminAccess: isAppAdmin || hasTeamAccess,
      isAppAdmin,
      isAffiliate,
      userRole,
      teamRole: teamRole || null
    })
  } catch (error) {
    console.error('Error checking membership:', error)
    return NextResponse.json({ hasAdminAccess: false, isAppAdmin: false, isAffiliate: false, userRole: 'user', teamRole: null })
  }
}
