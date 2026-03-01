import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createAdminClient()

    try {
      const { data: profile, error } = await admin
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        const msg = error.message || ''
        if (msg.includes('Could not find') || error.code === '42P01') {
          return NextResponse.json({
            profile: buildDefaultProfile(user.id),
            email: user.email,
          })
        }
        throw error
      }

      return NextResponse.json({
        profile: profile || buildDefaultProfile(user.id),
        email: user.email,
      })
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('Could not find') || err?.code === '42P01') {
        return NextResponse.json({
          profile: buildDefaultProfile(user.id),
          email: user.email,
        })
      }
      throw err
    }
  } catch (err) {
    console.error('User profile GET error:', err)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const admin = createAdminClient()

    const allowedFields = [
      'display_name', 'avatar_url', 'phone',
      'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
      'bio', 'timezone', 'preferences',
      'first_name', 'last_name', 'company', 'job_title', 'website',
    ]

    const profileData: Record<string, any> = {
      user_id: user.id,
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
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        const { error } = await admin
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', user.id)

        if (error) {
          if (error.code === '42703') {
            const minimalData: Record<string, any> = {
              user_id: user.id,
              updated_at: new Date().toISOString(),
            }
            const safeFields = ['display_name', 'avatar_url', 'phone', 'bio', 'timezone']
            for (const f of safeFields) {
              if (body[f] !== undefined) minimalData[f] = body[f]
            }
            const { error: retryErr } = await admin
              .from('user_profiles')
              .update(minimalData)
              .eq('user_id', user.id)
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
              user_id: user.id,
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
    console.error('User profile POST error:', err)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}

function buildDefaultProfile(userId: string) {
  return {
    user_id: userId,
    display_name: '',
    avatar_url: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    bio: '',
    timezone: 'UTC',
    preferences: {},
    first_name: '',
    last_name: '',
    company: '',
    job_title: '',
    website: '',
  }
}
