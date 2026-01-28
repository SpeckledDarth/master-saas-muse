import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    
    // First verify the user is authenticated and is admin
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
            }
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use service role to get all users (bypasses RLS)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get total users from auth.users using admin API (handle pagination)
    let allUsers: { id: string }[] = []
    let page = 1
    const perPage = 100
    
    while (true) {
      const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      })
      
      if (authError) {
        console.error('Error fetching auth users:', authError)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
      }
      
      if (!authUsers?.users || authUsers.users.length === 0) {
        break
      }
      
      allUsers = allUsers.concat(authUsers.users.map(u => ({ id: u.id })))
      
      if (authUsers.users.length < perPage) {
        break
      }
      page++
    }

    const totalUsers = allUsers.length

    // Get all roles for breakdown
    const { data: roles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('user_id, role')

    if (rolesError) {
      console.error('Error fetching roles:', rolesError)
      // Return partial data with just total users
      return NextResponse.json({
        totalUsers: totalUsers,
        admins: 0,
        members: totalUsers,
      })
    }

    // Count by role
    const adminUsers = new Set(roles?.filter(r => r.role === 'admin').map(r => r.user_id) || [])
    const memberUsers = new Set(roles?.filter(r => r.role === 'member').map(r => r.user_id) || [])
    
    // Users without roles are counted as members
    const usersWithRoles = new Set(roles?.map(r => r.user_id) || [])
    const usersWithoutRoles = Math.max(0, totalUsers - usersWithRoles.size)

    return NextResponse.json({
      totalUsers: totalUsers,
      admins: adminUsers.size,
      members: memberUsers.size + usersWithoutRoles,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
