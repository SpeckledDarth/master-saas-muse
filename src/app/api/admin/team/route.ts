import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: members, error } = await supabase
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
        const adminClient = createAdminClient()
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
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, email, role, memberId } = body

    if (action === 'invite') {
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error } = await supabase
        .from('invitations')
        .insert({
          organization_id: 1,
          email,
          role: role || 'member',
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString()
        })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Get settings for app name
      const { data: settingsData } = await supabase
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
          to: email,
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
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'remove') {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Team action error:', error)
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}
