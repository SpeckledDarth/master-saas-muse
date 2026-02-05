import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchWebhook } from '@/lib/webhooks/dispatcher'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to accept an invitation' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: invitation, error: inviteError } = await adminClient
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 })
    }

    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invitation has already been accepted' }, { status: 410 })
    }

    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({ 
        error: `This invitation was sent to ${invitation.email}. Please sign in with that email address.` 
      }, { status: 403 })
    }

    const { error: memberError } = await adminClient
      .from('organization_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
      })

    if (memberError) {
      if (memberError.code === '23505') {
        return NextResponse.json({ error: 'You are already a member of this organization' }, { status: 409 })
      }
      console.error('Error adding member:', memberError)
      return NextResponse.json({ error: 'Failed to add you to the organization' }, { status: 500 })
    }

    await adminClient
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    dispatchWebhook('team.member_joined', {
      email: user.email,
      userId: user.id,
      role: invitation.role,
      organizationId: invitation.organization_id,
    })

    return NextResponse.json({ success: true, message: 'Invitation accepted successfully' })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
  }
}
