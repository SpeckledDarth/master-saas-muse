import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()

    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    if (!body.userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const { data: targetUser } = await adminClient.auth.admin.getUserById(body.userId)
    if (!targetUser?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const cookieStore = await cookies()
    cookieStore.set('impersonation_target', body.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1800,
      path: '/',
    })
    cookieStore.set('impersonation_admin', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1800,
      path: '/',
    })

    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'user_impersonation_started',
      resource: 'user',
      details: {
        targetUserId: body.userId,
        targetEmail: targetUser.user.email,
      },
    })

    return NextResponse.json({
      success: true,
      targetUser: {
        id: targetUser.user.id,
        email: targetUser.user.email,
        name: targetUser.user.user_metadata?.full_name || targetUser.user.email,
      },
    })
  } catch (error) {
    console.error('Impersonation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const adminId = cookieStore.get('impersonation_admin')?.value
    const targetId = cookieStore.get('impersonation_target')?.value

    cookieStore.delete('impersonation_target')
    cookieStore.delete('impersonation_admin')

    if (adminId && targetId) {
      const adminClient = createAdminClient()
      await adminClient.from('audit_logs').insert({
        user_id: adminId,
        action: 'user_impersonation_ended',
        resource: 'user',
        details: { targetUserId: targetId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('End impersonation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
