import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Check if user has admin access
    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: teamMember } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', 1)
      .maybeSingle()

    const isAdmin = userRole?.role === 'admin'
    const canManageUsers = isAdmin || teamMember?.role === 'owner' || teamMember?.role === 'manager'
    
    if (!canManageUsers) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all user roles
    const { data: allRoles } = await adminClient
      .from('user_roles')
      .select('user_id, role, assigned_at')

    // Get organization members
    const { data: allMembers } = await adminClient
      .from('organization_members')
      .select('user_id, role, joined_at')
      .eq('organization_id', 1)

    // Get all auth users to get emails
    let authUsers: any[] = []
    try {
      const { data: authData } = await adminClient.auth.admin.listUsers()
      authUsers = authData?.users || []
    } catch (err) {
      console.error('Could not fetch auth users:', err)
    }

    // Create a map of user_id to email
    const emailMap = new Map<string, { email: string; created_at: string }>()
    for (const authUser of authUsers) {
      emailMap.set(authUser.id, {
        email: authUser.email || 'No email',
        created_at: authUser.created_at
      })
    }

    // Create role maps for quick lookup
    const appRoleMap = new Map<string, string>()
    const teamRoleMap = new Map<string, string>()

    if (allRoles) {
      for (const role of allRoles) {
        appRoleMap.set(role.user_id, role.role)
      }
    }

    if (allMembers) {
      for (const member of allMembers) {
        teamRoleMap.set(member.user_id, member.role)
      }
    }

    // Build user list from all auth users
    const userMap = new Map<string, { user_id: string; role: string; created_at: string; email: string }>()

    for (const authUser of authUsers) {
      const appRole = appRoleMap.get(authUser.id)
      const teamRole = teamRoleMap.get(authUser.id)
      
      // Priority: app admin > team role > empty
      let displayRole = ''
      if (appRole === 'admin') {
        displayRole = 'owner' // Show admin as owner in the dropdown
      } else if (teamRole) {
        displayRole = teamRole
      }

      userMap.set(authUser.id, {
        user_id: authUser.id,
        role: displayRole,
        created_at: authUser.created_at,
        email: authUser.email || 'Unknown'
      })
    }

    const users = Array.from(userMap.values()).map(u => ({
      id: u.user_id,
      email: u.email,
      role: u.role,
      created_at: u.created_at
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Check if user has admin access
    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: teamMember } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', 1)
      .maybeSingle()

    const isAdmin = userRole?.role === 'admin'
    const isOwner = teamMember?.role === 'owner'
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, role } = body

    // Check if user already has a team membership
    const { data: existingMember } = await adminClient
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', 1)
      .maybeSingle()

    if (existingMember) {
      // Update existing membership
      const { error } = await adminClient
        .from('organization_members')
        .update({ role })
        .eq('user_id', userId)
        .eq('organization_id', 1)

      if (error) {
        console.error('Error updating member role:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Create new membership
      const { error } = await adminClient
        .from('organization_members')
        .insert({
          user_id: userId,
          organization_id: 1,
          role: role,
          joined_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error creating member:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Also update user_roles if setting to admin
    if (role === 'admin') {
      await adminClient
        .from('user_roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}
