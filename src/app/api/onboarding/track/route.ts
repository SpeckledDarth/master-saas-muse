import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { step, step_name, action, metadata } = body

    if (typeof step !== 'number' || !step_name) {
      return NextResponse.json({ error: 'step (number) and step_name are required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('onboarding_events')
      .insert({
        user_id: user.id,
        step,
        step_name: step_name,
        action: action || 'viewed',
        metadata: metadata || {},
      })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ tracked: false, note: 'Onboarding events table not created yet' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tracked: true })
  } catch (error) {
    console.error('Onboarding tracking error:', error)
    return NextResponse.json({ error: 'Failed to track onboarding event' }, { status: 500 })
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

    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: events, error } = await adminClient
      .from('onboarding_events')
      .select('step, step_name, action, user_id')
      .order('step', { ascending: true })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ funnel: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const stepMap = new Map<number, { step: number; name: string; viewed: Set<string>; completed: Set<string> }>()

    for (const event of (events || [])) {
      if (!stepMap.has(event.step)) {
        stepMap.set(event.step, { step: event.step, name: event.step_name, viewed: new Set(), completed: new Set() })
      }
      const entry = stepMap.get(event.step)!
      if (event.action === 'viewed') entry.viewed.add(event.user_id)
      if (event.action === 'completed') entry.completed.add(event.user_id)
    }

    const funnel = Array.from(stepMap.values())
      .sort((a, b) => a.step - b.step)
      .map(s => ({
        step: s.step,
        name: s.name,
        viewed: s.viewed.size,
        completed: s.completed.size,
        dropOff: s.viewed.size > 0 ? Math.round((1 - s.completed.size / s.viewed.size) * 100) : 0,
      }))

    return NextResponse.json({ funnel })
  } catch (error) {
    console.error('Onboarding funnel error:', error)
    return NextResponse.json({ error: 'Failed to fetch funnel data' }, { status: 500 })
  }
}
