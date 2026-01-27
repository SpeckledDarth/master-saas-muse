import { createClient } from '@/lib/supabase/client'
import { SiteSettings, defaultSettings } from '@/types/settings'

export async function getSettings(): Promise<SiteSettings> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('organization_settings')
    .select('settings')
    .eq('app_id', 'default')
    .single()
  
  if (error || !data) {
    return defaultSettings
  }
  
  const dbSettings = data.settings as Partial<SiteSettings>
  return {
    branding: { ...defaultSettings.branding, ...dbSettings?.branding },
    pricing: { ...defaultSettings.pricing, ...dbSettings?.pricing },
    social: { ...defaultSettings.social, ...dbSettings?.social },
    features: { ...defaultSettings.features, ...dbSettings?.features },
    content: { ...defaultSettings.content, ...dbSettings?.content },
  }
}

export async function updateSettings(settings: Partial<SiteSettings>): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  const currentSettings = await getSettings()
  const newSettings = {
    branding: { ...currentSettings.branding, ...settings.branding },
    pricing: { ...currentSettings.pricing, ...settings.pricing },
    social: { ...currentSettings.social, ...settings.social },
    features: { ...currentSettings.features, ...settings.features },
    content: { ...currentSettings.content, ...settings.content },
  }
  
  const { error } = await supabase
    .from('organization_settings')
    .update({ 
      settings: newSettings,
      updated_at: new Date().toISOString()
    })
    .eq('app_id', 'default')
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

export function generateThemeCSS(branding: { primaryColor: string; accentColor: string }): string {
  return `
    :root {
      --theme-primary: ${branding.primaryColor};
      --theme-accent: ${branding.accentColor};
    }
  `
}
