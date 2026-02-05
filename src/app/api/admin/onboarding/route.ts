import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role or team owner role
    const adminClient = createAdminClient()
    
    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: teamMember } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', 1)
      .maybeSingle()

    const isAdmin = userRole?.role === 'admin'
    const isTeamOwner = teamMember?.role === 'owner'
    
    if (!isAdmin && !isTeamOwner) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: onboarding, error } = await adminClient
      .from('onboarding_state')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Onboarding fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!onboarding) {
      return NextResponse.json({ 
        completed: false, 
        current_step: 1, 
        completed_steps: [] 
      })
    }

    return NextResponse.json(onboarding)
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: 'Failed to fetch onboarding state' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role or team owner role
    const adminClient = createAdminClient()
    
    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: teamMember } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', 1)
      .maybeSingle()

    const isAdmin = userRole?.role === 'admin'
    const isTeamOwner = teamMember?.role === 'owner'
    
    if (!isAdmin && !isTeamOwner) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { current_step, completed_steps, completed } = body

    const { data: existing } = await adminClient
      .from('onboarding_state')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      const { error } = await adminClient
        .from('onboarding_state')
        .update({
          current_step,
          completed_steps,
          completed,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      const { error } = await adminClient
        .from('onboarding_state')
        .insert({
          user_id: user.id,
          current_step,
          completed_steps,
          completed
        })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding save error:', error)
    return NextResponse.json({ error: 'Failed to save onboarding state' }, { status: 500 })
  }
}
