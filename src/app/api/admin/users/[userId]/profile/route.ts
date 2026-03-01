import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAdminAuth(adminClient: any, userId: string): Promise<boolean> {
  try {
    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (userRole?.role === 'admin') return true

    const { data: teamMember } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (teamMember?.role === 'admin' || teamMember?.role === 'owner') return true

    return false
  } catch {
    return false
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createAdminClient()

    const isAdmin = await checkAdminAuth(admin, user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    try {
      const { data: profile, error } = await admin
        .from('user_profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle()

      if (error) {
        const msg = error.message || ''
        if (msg.includes('Could not find') || error.code === '42P01') {
          return NextResponse.json({ profile: null })
        }
        throw error
      }

      return NextResponse.json({ profile: profile || null })
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('Could not find') || err?.code === '42P01') {
        return NextResponse.json({ profile: null })
      }
      throw err
    }
  } catch (err) {
    console.error('Admin user profile GET error:', err)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createAdminClient()

    const isAdmin = await checkAdminAuth(admin, user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()

    const allowedFields = [
      'display_name', 'avatar_url', 'phone',
      'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
      'bio', 'timezone', 'preferences',
      'first_name', 'last_name', 'company', 'job_title', 'website',
    ]

    const profileData: Record<string, any> = {
      user_id: targetUserId,
      updated_at: new Date().toISOString(),
    }

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        profileData[field] = body[field]
      }
    }

    try {
      const { data: existing } = await admin
        .from('user_profiles')
        .select('id')
        .eq('user_id', targetUserId)
        .maybeSingle()

      if (existing) {
        const { error } = await admin
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', targetUserId)

        if (error) {
          if (error.code === '42703') {
            const minimalData: Record<string, any> = {
              user_id: targetUserId,
              updated_at: new Date().toISOString(),
            }
            const safeFields = ['display_name', 'avatar_url', 'phone', 'bio', 'timezone']
            for (const f of safeFields) {
              if (body[f] !== undefined) minimalData[f] = body[f]
            }
            const { error: retryErr } = await admin
              .from('user_profiles')
              .update(minimalData)
              .eq('user_id', targetUserId)
            if (retryErr) throw retryErr
          } else {
            throw error
          }
        }
      } else {
        profileData.created_at = new Date().toISOString()
        const { error } = await admin
          .from('user_profiles')
          .insert(profileData)

        if (error) {
          if (error.code === '42703') {
            const minimalData: Record<string, any> = {
              user_id: targetUserId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            const safeFields = ['display_name', 'avatar_url', 'phone', 'bio', 'timezone']
            for (const f of safeFields) {
              if (body[f] !== undefined) minimalData[f] = body[f]
            }
            const { error: retryErr } = await admin
              .from('user_profiles')
              .insert(minimalData)
            if (retryErr) throw retryErr
          } else {
            throw error
          }
        }
      }

      return NextResponse.json({ success: true })
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('Could not find') || err?.code === '42P01') {
        return NextResponse.json({ error: 'Profile table not available yet' }, { status: 503 })
      }
      throw err
    }
  } catch (err) {
    console.error('Admin user profile PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
