import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getQueueMetrics, getRecentJobs, retryFailedJob, clearFailedJobs, getQueueHealth } from '@/lib/queue'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function checkAdminAccess(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const admin = getSupabaseAdmin()
    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .single()

    return !!member
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!(await checkAdminAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'metrics'

  switch (action) {
    case 'metrics': {
      const metrics = await getQueueMetrics()
      const health = await getQueueHealth()
      return NextResponse.json({ metrics, health })
    }

    case 'jobs': {
      const status = (searchParams.get('status') || 'completed') as 'completed' | 'failed' | 'waiting' | 'active' | 'delayed'
      const jobs = await getRecentJobs(status)
      return NextResponse.json({ jobs })
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAdminAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action, jobId } = body

  switch (action) {
    case 'retry': {
      if (!jobId) {
        return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
      }
      const success = await retryFailedJob(jobId)
      return NextResponse.json({ success })
    }

    case 'clear-failed': {
      const cleared = await clearFailedJobs()
      return NextResponse.json({ cleared })
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}
