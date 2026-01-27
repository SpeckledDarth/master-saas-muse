import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { defaultSettings, SiteSettings } from '@/types/settings'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthenticatedUser(request: NextRequest) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
          }
        },
      },
    }
  )
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await getSupabaseAdmin()
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()
  
  return data?.role === 'admin'
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const isAdminUser = await isAdmin(user.id)
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const { data, error } = await getSupabaseAdmin()
    .from('organization_settings')
    .select('settings')
    .eq('app_id', 'default')
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      await getSupabaseAdmin()
        .from('organization_settings')
        .insert({ app_id: 'default', settings: defaultSettings })
      
      return NextResponse.json({ settings: defaultSettings })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  const mergedSettings: SiteSettings = {
    branding: { ...defaultSettings.branding, ...data?.settings?.branding },
    pricing: { ...defaultSettings.pricing, ...data?.settings?.pricing },
    social: { ...defaultSettings.social, ...data?.settings?.social },
    features: { ...defaultSettings.features, ...data?.settings?.features },
    content: { ...defaultSettings.content, ...data?.settings?.content },
  }
  
  return NextResponse.json({ settings: mergedSettings })
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const isAdminUser = await isAdmin(user.id)
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const body = await request.json()
  const { settings } = body as { settings: Partial<SiteSettings> }
  
  const { data: current } = await getSupabaseAdmin()
    .from('organization_settings')
    .select('settings')
    .eq('app_id', 'default')
    .single()
  
  const currentSettings = current?.settings || defaultSettings
  
  const newSettings: SiteSettings = {
    branding: { ...defaultSettings.branding, ...currentSettings.branding, ...settings.branding },
    pricing: { ...defaultSettings.pricing, ...currentSettings.pricing, ...settings.pricing },
    social: { ...defaultSettings.social, ...currentSettings.social, ...settings.social },
    features: { ...defaultSettings.features, ...currentSettings.features, ...settings.features },
    content: { ...defaultSettings.content, ...currentSettings.content, ...settings.content },
  }
  
  const { error } = await getSupabaseAdmin()
    .from('organization_settings')
    .update({ 
      settings: newSettings,
      updated_at: new Date().toISOString()
    })
    .eq('app_id', 'default')
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  await getSupabaseAdmin()
    .from('audit_logs')
    .insert({
      user_id: user.id,
      action: 'settings_updated',
      details: { section: Object.keys(settings).join(', ') }
    })
  
  return NextResponse.json({ success: true, settings: newSettings })
}
