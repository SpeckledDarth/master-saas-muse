import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeamPermissions, type TeamRole } from '@/lib/team-permissions'
import { sendEmail } from '@/lib/email'

async function checkUserPermissions(userId: string, adminClient: any) {
  const { data: userRole } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()

  if (userRole?.role === 'admin') {
    return { isAppAdmin: true, permissions: getTeamPermissions('owner') }
  }

  const { data: teamMember } = await adminClient
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .single()

  if (teamMember?.role) {
    return { 
      isAppAdmin: false, 
      permissions: getTeamPermissions(teamMember.role as TeamRole)
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

    const adminClient = createAdminClient()
    const { permissions } = await checkUserPermissions(user.id, adminClient)
    
    if (!permissions || !permissions.canViewTeamList) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data: invitations, error } = await adminClient
      .from('invitations')
      .select('*')
      .is('accepted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ invitations: invitations || [] })
  } catch (error) {
    console.error('Invitations fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { permissions } = await checkUserPermissions(user.id, adminClient)
    
    if (!permissions || !permissions.canInviteMembers) {
      return NextResponse.json({ error: 'You do not have permission to resend invitations' }, { status: 403 })
    }

    const body = await request.json()
    const { action, invitationId } = body

    if (action === 'resend') {
      // Get the invitation
      const { data: invitation, error: fetchError } = await adminClient
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single()

      if (fetchError || !invitation) {
        return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
      }

      // Generate new token and extend expiry
      const newToken = crypto.randomUUID()
      const newExpiresAt = new Date()
      newExpiresAt.setDate(newExpiresAt.getDate() + 7)

      const { error: updateError } = await adminClient
        .from('invitations')
        .update({ 
          token: newToken, 
          expires_at: newExpiresAt.toISOString() 
        })
        .eq('id', invitationId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Get settings for app name
      const { data: settingsData } = await adminClient
        .from('organization_settings')
        .select('settings')
        .eq('app_id', 'default')
        .single()
      
      const appName = settingsData?.settings?.branding?.appName || 'Our App'
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
      const inviteLink = `${siteUrl}/invite/${newToken}`

      // Send email
      try {
        await sendEmail({
          to: invitation.email,
          subject: `Reminder: You've been invited to join ${appName}`,
          html: `
            <h2>Invitation Reminder</h2>
            <p>This is a reminder that you've been invited to join ${appName} as a ${invitation.role}.</p>
            <p>Click the link below to accept the invitation:</p>
            <p><a href="${inviteLink}">${inviteLink}</a></p>
            <p>This invitation expires in 7 days.</p>
            <p>Best regards,<br>The ${appName} Team</p>
          `,
        })
      } catch (emailError) {
        console.log('Email not sent:', emailError)
      }

      return NextResponse.json({ success: true, message: 'Invitation resent' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Resend invitation error:', error)
    return NextResponse.json({ error: 'Failed to resend invitation' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { permissions } = await checkUserPermissions(user.id, adminClient)
    
    // Only app admins, owners, and managers can cancel invitations
    if (!permissions || !permissions.canInviteMembers) {
      return NextResponse.json({ error: 'You do not have permission to cancel invitations' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID required' }, { status: 400 })
    }
    const { error } = await adminClient
      .from('invitations')
      .delete()
      .eq('id', invitationId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete invitation error:', error)
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 })
  }
}
