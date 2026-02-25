import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createTrialExpiryAlerts } from '@/lib/affiliate/notifications'

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const sent = await createTrialExpiryAlerts(admin)

    return NextResponse.json({ sent })
  } catch (error: any) {
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ skipped: true, reason: 'tables not created yet' })
    }
    console.error('Trial alerts cron error:', error)
    return NextResponse.json({ error: 'Failed to process trial alerts' }, { status: 500 })
  }
}
