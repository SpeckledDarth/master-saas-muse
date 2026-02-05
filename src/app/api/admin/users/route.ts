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

    // Combine users from both tables (using user_id as the key)
    const userMap = new Map<string, { user_id: string; role: string; created_at: string; email: string }>()

    // Add users from user_roles
    if (allRoles) {
      for (const role of allRoles) {
        const authInfo = emailMap.get(role.user_id)
        userMap.set(role.user_id, {
          user_id: role.user_id,
          role: role.role,
          created_at: authInfo?.created_at || role.assigned_at,
          email: authInfo?.email || 'Unknown'
        })
      }
    }

    // Add/update users from organization_members
    if (allMembers) {
      for (const member of allMembers) {
        const existing = userMap.get(member.user_id)
        const authInfo = emailMap.get(member.user_id)
        if (existing) {
          // Keep the higher role priority
          existing.role = existing.role === 'admin' ? 'admin' : member.role
        } else {
          userMap.set(member.user_id, {
            user_id: member.user_id,
            role: member.role,
            created_at: authInfo?.created_at || member.joined_at,
            email: authInfo?.email || 'Unknown'
          })
        }
      }
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

    // Update user role
    const { error } = await adminClient
      .from('user_roles')
      .upsert({ 
        user_id: userId, 
        role: role 
      }, { 
        onConflict: 'user_id' 
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}
