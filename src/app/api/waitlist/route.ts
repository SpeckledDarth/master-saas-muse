import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeamPermissions, type TeamRole } from '@/lib/team-permissions'

async function checkUserPermissions(userId: string, adminClient: any) {
  const { data: userRole } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (userRole?.role === 'admin') {
    return { isAppAdmin: true, permissions: getTeamPermissions('owner') }
  }

  const { data: teamMember } = await adminClient
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', 1)
    .maybeSingle()

  if (teamMember?.role) {
    return { 
      isAppAdmin: false, 
      permissions: getTeamPermissions(teamMember.role as TeamRole)
    }
  }

  return { isAppAdmin: false, permissions: null }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, name, referralSource } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('waitlist_entries')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ message: 'You\'re already on the waitlist!' })
    }

    const { error } = await supabase
      .from('waitlist_entries')
      .insert({
        email: email.toLowerCase(),
        name,
        referral_source: referralSource,
      })

    if (error) {
      console.error('Waitlist error:', error)
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'You\'re on the list!' })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
  }
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
    
    if (!permissions?.canViewAnalytics) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    const { data: entries, error } = await adminClient
      .from('waitlist_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ entries: entries || [] })
  } catch (error) {
    console.error('Waitlist fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 })
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
    
    if (!permissions?.canManageUsers) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('id')

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 })
    }

    const { error } = await adminClient
      .from('waitlist_entries')
      .delete()
      .eq('id', entryId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Waitlist delete error:', error)
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}
