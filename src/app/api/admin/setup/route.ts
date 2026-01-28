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
  
  const dbPages = data?.settings?.pages || {}
  const mergedSettings: SiteSettings = {
    branding: { ...defaultSettings.branding, ...data?.settings?.branding },
    pricing: { ...defaultSettings.pricing, ...data?.settings?.pricing },
    social: { ...defaultSettings.social, ...data?.settings?.social },
    features: { ...defaultSettings.features, ...data?.settings?.features },
    content: { ...defaultSettings.content, ...data?.settings?.content },
    pages: {
      about: { ...defaultSettings.pages.about, ...dbPages.about },
      contact: { ...defaultSettings.pages.contact, ...dbPages.contact },
      legal: { ...defaultSettings.pages.legal, ...dbPages.legal },
      pricing: { ...defaultSettings.pages.pricing, ...dbPages.pricing },
      faq: { ...defaultSettings.pages.faq, ...dbPages.faq },
      customPages: dbPages.customPages || defaultSettings.pages.customPages,
    },
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
  
  console.log('[Setup API] Received settings to save:', JSON.stringify(settings, null, 2))
  
  const { data: current } = await getSupabaseAdmin()
    .from('organization_settings')
    .select('settings')
    .eq('app_id', 'default')
    .single()
  
  const currentSettings = current?.settings || defaultSettings
  
  console.log('[Setup API] Current branding in DB:', JSON.stringify(currentSettings.branding, null, 2))
  console.log('[Setup API] Incoming branding:', JSON.stringify(settings.branding, null, 2))
  
  const currentPages = (currentSettings.pages || {}) as any
  const incomingPages = (settings.pages || {}) as any
  const newSettings: SiteSettings = {
    branding: { ...defaultSettings.branding, ...currentSettings.branding, ...settings.branding },
    pricing: { ...defaultSettings.pricing, ...currentSettings.pricing, ...settings.pricing },
    social: { ...defaultSettings.social, ...currentSettings.social, ...settings.social },
    features: { ...defaultSettings.features, ...currentSettings.features, ...settings.features },
    content: { ...defaultSettings.content, ...currentSettings.content, ...settings.content },
    pages: {
      about: { ...defaultSettings.pages.about, ...currentPages.about, ...incomingPages.about },
      contact: { ...defaultSettings.pages.contact, ...currentPages.contact, ...incomingPages.contact },
      legal: { ...defaultSettings.pages.legal, ...currentPages.legal, ...incomingPages.legal },
      pricing: { ...defaultSettings.pages.pricing, ...currentPages.pricing, ...incomingPages.pricing },
      faq: { ...defaultSettings.pages.faq, ...currentPages.faq, ...incomingPages.faq },
      customPages: incomingPages.customPages || currentPages.customPages || defaultSettings.pages.customPages,
    },
  }
  
  console.log('[Setup API] Merged branding to save:', JSON.stringify(newSettings.branding, null, 2))
  
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
