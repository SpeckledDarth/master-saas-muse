import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { getTeamPermissions, type TeamRole } from '@/lib/team-permissions'

async function checkUserPermissions(userId: string, adminClient: any) {
  // Check if user is app admin (full access)
  const { data: userRole } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (userRole?.role === 'admin') {
    return { isAppAdmin: true, permissions: getTeamPermissions('owner') }
  }

  // Check team membership (organization_id = 1 for single-org setup)
  const { data: teamMember } = await adminClient
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', 1)
    .maybeSingle()

  if (teamMember?.role) {
    return { 
      isAppAdmin: false, 
      permissions: getTeamPermissions(teamMember.role as TeamRole),
      teamRole: teamMember.role as TeamRole
    }
  }

  return { isAppAdmin: false, permissions: null }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client for all operations to bypass RLS
    const adminClient = createAdminClient()

    // Check permissions
    const { isAppAdmin, permissions } = await checkUserPermissions(user.id, adminClient)
    
    if (!permissions || !permissions.canViewTeamList) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Auto-add app admin to organization_members as owner if not present (single-org setup)
    if (isAppAdmin) {
      const { data: existingMember } = await adminClient
        .from('organization_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', 1)
        .maybeSingle()
      
      if (!existingMember) {
        const { error: insertError } = await adminClient
          .from('organization_members')
          .insert({
            organization_id: 1,
            user_id: user.id,
            role: 'owner',
            joined_at: new Date().toISOString()
          })
        
        if (insertError) {
          // Handle race condition or constraint violation gracefully
          console.log('[Team API] Could not auto-add owner (may already exist):', insertError.message)
        } else {
          console.log('[Team API] Auto-added app admin as owner to organization_members')
        }
      }
    }
    
    const { data: members, error } = await adminClient
      .from('organization_members')
      .select('*')
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching team members:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const memberIds = members?.map(m => m.user_id) || []
    
    let users: any[] = []
    if (memberIds.length > 0) {
      try {
        const { data: authUsers } = await adminClient.auth.admin.listUsers()
        users = authUsers?.users?.filter(u => memberIds.includes(u.id)) || []
      } catch (adminError) {
        console.error('Admin client error:', adminError)
      }
    }

    const enrichedMembers = members?.map(member => {
      const authUser = users.find(u => u.id === member.user_id)
      return {
        ...member,
        email: authUser?.email || 'Unknown',
        name: authUser?.user_metadata?.display_name || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'Unknown',
        avatar: authUser?.user_metadata?.avatar_url
      }
    }) || []

    return NextResponse.json({ members: enrichedMembers })
  } catch (error) {
    console.error('Team fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Team API] POST request received')
    
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[Team API] No user found - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[Team API] User authenticated:', user.id)

    // Use admin client for all operations to bypass RLS
    let adminClient
    try {
      adminClient = createAdminClient()
      console.log('[Team API] Admin client created successfully')
    } catch (adminError) {
      console.error('[Team API] Failed to create admin client:', adminError)
      return NextResponse.json({ error: 'Admin client configuration error' }, { status: 500 })
    }

    // Check permissions
    const { isAppAdmin, permissions } = await checkUserPermissions(user.id, adminClient)
    console.log('[Team API] Permission check result:', { isAppAdmin, permissions })

    if (!permissions) {
      console.log('[Team API] No permissions, access denied')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { action, email, role, memberId } = body
    console.log('[Team API] Action:', action, 'Email:', email, 'Role:', role)

    if (action === 'invite') {
      // Only app admins, owners, and managers can invite
      if (!permissions.canInviteMembers) {
        return NextResponse.json({ error: 'You do not have permission to invite members' }, { status: 403 })
      }
      console.log('[Team API] Processing invite action')
      
      // Normalize email to lowercase for consistency
      const normalizedEmail = email.toLowerCase().trim()
      
      // Check if there's already a pending invitation for this email
      const { data: existingInvitation } = await adminClient
        .from('invitations')
        .select('id')
        .eq('email', normalizedEmail)
        .eq('organization_id', 1)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()
      
      if (existingInvitation) {
        return NextResponse.json({ 
          error: 'A pending invitation already exists for this email. Cancel it first or use resend.' 
        }, { status: 400 })
      }
      
      // Check if user is already a member
      const { data: authUsers } = await adminClient.auth.admin.listUsers()
      const existingUser = authUsers?.users?.find(u => u.email?.toLowerCase() === normalizedEmail)
      
      if (existingUser) {
        const { data: existingMember } = await adminClient
          .from('organization_members')
          .select('id')
          .eq('user_id', existingUser.id)
          .eq('organization_id', 1)
          .maybeSingle()
        
        if (existingMember) {
          return NextResponse.json({ 
            error: 'This user is already a team member.' 
          }, { status: 400 })
        }
      }
      
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      console.log('[Team API] Inserting invitation for:', normalizedEmail)
      const { data: insertData, error } = await adminClient
        .from('invitations')
        .insert({
          organization_id: 1,
          email: normalizedEmail,
          role: role || 'member',
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString()
        })
        .select()

      console.log('[Team API] Insert result:', insertData, 'Error:', error)

      if (error) {
        console.error('[Team API] Invitation insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      console.log('[Team API] Invitation inserted successfully')

      // Get settings for app name
      const { data: settingsData } = await adminClient
        .from('organization_settings')
        .select('settings')
        .eq('app_id', 'default')
        .single()
      
      const appName = settingsData?.settings?.branding?.appName || 'Our App'
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
      const inviteLink = `${siteUrl}/invite/${token}`

      // Try to send email
      try {
        await sendEmail({
          to: normalizedEmail,
          subject: `You've been invited to join ${appName}`,
          html: `
            <h2>You've been invited!</h2>
            <p>You've been invited to join ${appName} as a ${role || 'member'}.</p>
            <p>Click the link below to accept the invitation:</p>
            <p><a href="${inviteLink}">${inviteLink}</a></p>
            <p>This invitation expires in 7 days.</p>
            <p>Best regards,<br>The ${appName} Team</p>
          `,
        })
      } catch (emailError) {
        console.log('Email not sent (Resend may not be configured):', emailError)
        // Continue without email - invitation is still saved
      }

      return NextResponse.json({ success: true, message: 'Invitation sent' })
    }

    if (action === 'update_role') {
      // Only app admins and owners can change roles
      if (!permissions.canManageTeam) {
        return NextResponse.json({ error: 'You do not have permission to change roles' }, { status: 403 })
      }
      
      const { error } = await adminClient
        .from('organization_members')
        .update({ role })
        .eq('id', memberId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'remove') {
      // Only app admins and owners can remove members
      if (!permissions.canManageTeam) {
        return NextResponse.json({ error: 'You do not have permission to remove members' }, { status: 403 })
      }
      
      const { error } = await adminClient
        .from('organization_members')
        .delete()
        .eq('id', memberId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Team action error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Failed to perform action',
      details: String(error)
    }, { status: 500 })
  }
}
