import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdmin()
    const { data: orgData } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
    const settings = (orgData?.settings || {}) as any
    const allLeads: any[] = settings.socialModule?.leads || []
    const leads = allLeads.filter((l: any) => l.userId === user.id || !l.userId)

    const headers = ['Name', 'Platform', 'Signal', 'Snippet', 'Status', 'Tags', 'Notes', 'Date']
    const rows = leads.map((lead: any) => [
      escapeCsvField(lead.name || ''),
      escapeCsvField(lead.platform || ''),
      escapeCsvField(lead.signal || ''),
      escapeCsvField(lead.snippet || ''),
      escapeCsvField(lead.status || ''),
      escapeCsvField((lead.tags || []).join('; ')),
      escapeCsvField((lead.notes || []).join('; ')),
      escapeCsvField(lead.createdAt || ''),
    ])

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="leads-export.csv"',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to export leads' }, { status: 500 })
  }
}
