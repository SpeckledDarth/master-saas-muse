import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { defaultSettings, SiteSettings } from '@/types/settings'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('organization_settings')
      .select('settings')
      .eq('app_id', 'default')
      .single()

    if (error || !data?.settings) {
      return NextResponse.json({ settings: defaultSettings })
    }

    const dbSettings = data.settings as Partial<SiteSettings>
    const dbPages = dbSettings?.pages || {} as any
    const dbBranding = dbSettings?.branding || {} as any

    const s = data.settings as any
    const mergedSettings: SiteSettings = {
      branding: {
        ...defaultSettings.branding,
        ...dbBranding,
        lightTheme: { ...defaultSettings.branding.lightTheme, ...(dbBranding.lightTheme || {}) },
        darkTheme: { ...defaultSettings.branding.darkTheme, ...(dbBranding.darkTheme || {}) },
      },
      pricing: { ...defaultSettings.pricing, ...(s.pricing || {}) },
      social: { ...defaultSettings.social, ...(s.social || {}) },
      features: { ...defaultSettings.features, ...(s.features || {}) },
      ai: { ...defaultSettings.ai, ...(s.ai || {}) },
      webhooks: {
        ...defaultSettings.webhooks!,
        ...(s.webhooks || {}),
        events: { ...defaultSettings.webhooks!.events, ...(s.webhooks?.events || {}) },
      },
      content: { ...defaultSettings.content, ...(s.content || {}) },
      announcement: { ...defaultSettings.announcement, ...(s.announcement || {}) },
      navigation: {
        items: s.navigation?.items || defaultSettings.navigation?.items || [],
      },
      pages: {
        about: { ...defaultSettings.pages.about, ...(dbPages as any).about },
        contact: { ...defaultSettings.pages.contact, ...(dbPages as any).contact },
        legal: { ...defaultSettings.pages.legal, ...(dbPages as any).legal },
        pricing: { ...defaultSettings.pages.pricing, ...(dbPages as any).pricing },
        faq: { ...defaultSettings.pages.faq, ...(dbPages as any).faq },
        customPages: (dbPages as any).customPages || defaultSettings.pages.customPages,
      },
      support: { ...defaultSettings.support, ...(s.support || {}) },
      compliance: { ...defaultSettings.compliance, ...(s.compliance || {}) },
      security: { ...defaultSettings.security, ...(s.security || {}) },
    }

    return NextResponse.json({ settings: mergedSettings }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (err) {
    console.error('[Public Settings API] Error:', err)
    return NextResponse.json({ settings: defaultSettings })
  }
}
