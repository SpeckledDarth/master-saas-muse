import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ hasAdminAccess: false, isAppAdmin: false })
    }

    const adminClient = createAdminClient()

    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    
    const isAppAdmin = roleData?.role === 'admin'

    // Use limit(1) instead of maybeSingle to handle duplicate entries gracefully
    const { data: memberData, error: memberError } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', 1)
      .order('joined_at', { ascending: false })
      .limit(1)
    
    if (memberError) {
      console.error('[Membership API] Error fetching member:', memberError)
    }
    
    const teamRole = memberData?.[0]?.role
    const hasTeamAccess = teamRole === 'owner' || teamRole === 'manager' || teamRole === 'member'
    
    console.log('[Membership API] User:', user.email, 'isAppAdmin:', isAppAdmin, 'teamRole:', teamRole, 'hasTeamAccess:', hasTeamAccess)
    
    return NextResponse.json({ 
      hasAdminAccess: isAppAdmin || hasTeamAccess,
      isAppAdmin,
      teamRole: teamRole || null
    })
  } catch (error) {
    console.error('Error checking membership:', error)
    return NextResponse.json({ hasAdminAccess: false, isAppAdmin: false })
  }
}
