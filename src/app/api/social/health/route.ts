import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPlatformClient, type SocialPlatform } from '@/lib/social/client'
import { addSocialHealthCheckJob } from '@/lib/queue'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()
    return data?.role === 'admin'
  } catch {
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from('team_members')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'owner'])
      .maybeSingle()
    return !!data
  }
}

const PLATFORMS: SocialPlatform[] = ['twitter', 'linkedin', 'instagram']

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isAdminUser(user.id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const results: Record<string, { healthy: boolean; latencyMs: number }> = {}

    await Promise.all(
      PLATFORMS.map(async (platform) => {
        try {
          const client = getPlatformClient(platform)
          const health = await client.checkHealth()
          results[platform] = health
        } catch {
          results[platform] = { healthy: false, latencyMs: 0 }
        }
      })
    )

    return NextResponse.json({ platforms: results })
  } catch (err) {
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 })
  }
}

export async function POST() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isAdminUser(user.id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    await addSocialHealthCheckJob({
      platforms: PLATFORMS,
      failureThreshold: 2,
    })

    return NextResponse.json({ queued: true })
  } catch (err) {
    return NextResponse.json({ error: 'Could not enqueue health check job' }, { status: 500 })
  }
}
