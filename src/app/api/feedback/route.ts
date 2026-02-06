import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeamPermissions, type TeamRole } from '@/lib/team-permissions'
import { dispatchWebhook } from '@/lib/webhooks/dispatcher'

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
    const { message, email, pageUrl, npsScore } = body

    if (!message || message.trim().length < 10) {
      return NextResponse.json({ error: 'Please provide more details' }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    const npsValue = typeof npsScore === 'number' && npsScore >= 0 && npsScore <= 10 ? npsScore : null
    const baseRecord: Record<string, any> = {
      message: message.trim(),
      email: email || user?.email,
      user_id: user?.id,
      page_url: pageUrl,
    }

    let { error } = await supabase
      .from('feedback')
      .insert({ ...baseRecord, nps_score: npsValue })

    if (error && error.message?.includes('nps_score')) {
      console.warn('Feedback: nps_score column not found in database. Submitting without NPS. Run: ALTER TABLE feedback ADD COLUMN nps_score integer;')
      const fallback = await supabase
        .from('feedback')
        .insert(baseRecord)
      error = fallback.error
    }

    if (error) {
      console.error('Feedback error:', error)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    dispatchWebhook('feedback.submitted', {
      message: message.trim(),
      email: email || user?.email || null,
      userId: user?.id || null,
      pageUrl: pageUrl || null,
    })

    return NextResponse.json({ success: true, message: 'Thank you for your feedback!' })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
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
    const { data: feedback, error } = await adminClient
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ feedback: feedback || [] })
  } catch (error) {
    console.error('Feedback fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { permissions } = await checkUserPermissions(user.id, adminClient)
    
    if (!permissions?.canEditContent) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status } = body

    const { error } = await adminClient
      .from('feedback')
      .update({ status })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback update error:', error)
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
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
    const feedbackId = searchParams.get('id')

    if (!feedbackId) {
      return NextResponse.json({ error: 'Feedback ID required' }, { status: 400 })
    }

    const { error } = await adminClient
      .from('feedback')
      .delete()
      .eq('id', feedbackId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback delete error:', error)
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 })
  }
}
