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

    const { data: memberData } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', 1)
      .maybeSingle()
    
    const teamRole = memberData?.role
    const hasTeamAccess = teamRole === 'owner' || teamRole === 'manager' || teamRole === 'member'
    
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
