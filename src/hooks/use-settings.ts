'use client'

import { useState, useEffect } from 'react'
import { SiteSettings, defaultSettings } from '@/types/settings'
import { createClient } from '@/lib/supabase/client'

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('organization_settings')
          .select('settings')
          .eq('app_id', 'default')
          .single()
        
        if (error) {
          if (error.code !== 'PGRST116') {
            setError(error.message)
          }
          setLoading(false)
          return
        }
        
        if (data?.settings) {
          setSettings({
            branding: { ...defaultSettings.branding, ...data.settings.branding },
            pricing: { ...defaultSettings.pricing, ...data.settings.pricing },
            social: { ...defaultSettings.social, ...data.settings.social },
            features: { ...defaultSettings.features, ...data.settings.features },
          })
        }
        
        setLoading(false)
      } catch (err) {
        setError('Failed to load settings')
        setLoading(false)
      }
    }
    
    loadSettings()
  }, [])

  return { settings, loading, error }
}

export function useThemeFromSettings(settings: SiteSettings) {
  useEffect(() => {
    if (settings.branding.primaryColor) {
      document.documentElement.style.setProperty('--theme-primary', settings.branding.primaryColor)
    }
    if (settings.branding.accentColor) {
      document.documentElement.style.setProperty('--theme-accent', settings.branding.accentColor)
    }
  }, [settings.branding.primaryColor, settings.branding.accentColor])
}
