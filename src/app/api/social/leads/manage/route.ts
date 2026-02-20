import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} }
    }
  })
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdmin()
    const { data: orgData } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
    const settings = (orgData?.settings || {}) as any
    const allLeads: any[] = settings.socialModule?.leads || []
    const leads = allLeads.filter((l: any) => l.userId === user.id)

    return NextResponse.json({ leads })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, platform, snippet, signal, suggestedReply, tags } = body

    if (!name || !platform || !snippet || !signal) {
      return NextResponse.json({ error: 'Missing required fields: name, platform, snippet, signal' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { data: orgData } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
    const settings = (orgData?.settings || {}) as any
    const existingLeads = settings.socialModule?.leads || []

    const newLead = {
      id: randomUUID(),
      userId: user.id,
      name,
      platform,
      snippet,
      signal,
      suggestedReply: suggestedReply || '',
      tags: tags || [],
      notes: [],
      status: 'new',
      time: 'Just now',
      createdAt: new Date().toISOString(),
    }

    const updatedLeads = [newLead, ...existingLeads]
    const updatedSettings = {
      ...settings,
      socialModule: { ...(settings.socialModule || {}), leads: updatedLeads }
    }

    const { error } = await admin.from('organization_settings').update({ settings: updatedSettings }).eq('app_id', 'default')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ lead: newLead })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, tags, notes, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { data: orgData } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
    const settings = (orgData?.settings || {}) as any
    const existingLeads: any[] = settings.socialModule?.leads || []

    const leadIndex = existingLeads.findIndex((l: any) => l.id === id && (l.userId === user.id || !l.userId))
    if (leadIndex === -1) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const updatedLead = { ...existingLeads[leadIndex] }
    if (tags !== undefined) updatedLead.tags = tags
    if (notes !== undefined) updatedLead.notes = notes
    if (status !== undefined) updatedLead.status = status

    existingLeads[leadIndex] = updatedLead

    const updatedSettings = {
      ...settings,
      socialModule: { ...(settings.socialModule || {}), leads: existingLeads }
    }

    const { error } = await admin.from('organization_settings').update({ settings: updatedSettings }).eq('app_id', 'default')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ lead: updatedLead })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}
