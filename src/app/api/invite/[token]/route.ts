import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const adminClient = createAdminClient()

    const { data: invitation, error } = await adminClient
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 })
    }

    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invitation has already been accepted' }, { status: 410 })
    }

    const { data: settings } = await adminClient
      .from('organization_settings')
      .select('settings')
      .eq('app_id', 'default')
      .single()

    const organizationName = settings?.settings?.branding?.appName || 'Our App'

    return NextResponse.json({
      email: invitation.email,
      role: invitation.role,
      organizationName,
      expiresAt: invitation.expires_at,
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 })
  }
}
