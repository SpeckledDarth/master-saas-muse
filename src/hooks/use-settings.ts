'use client'

import { useState, useEffect } from 'react'
import { SiteSettings, defaultSettings } from '@/types/settings'
import { createClient } from '@/lib/supabase/client'

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      if (!settings) {
        setSettings(defaultSettings)
      }
      setLoading(false)
    }, 5000)
    
    async function loadSettings() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          setSettings(defaultSettings)
          setLoading(false)
          return
        }
        
        const supabase = createClient()
        const { data, error } = await supabase
          .from('organization_settings')
          .select('settings')
          .eq('app_id', 'default')
          .single()
        
        if (error) {
          if (error.code !== 'PGRST116') {
            console.error('Settings error:', error.message)
          }
          setSettings(defaultSettings)
          setLoading(false)
          return
        }
        
        if (data?.settings) {
          const dbPages = data.settings.pages || {}
          setSettings({
            branding: { ...defaultSettings.branding, ...data.settings.branding },
            pricing: { ...defaultSettings.pricing, ...data.settings.pricing },
            social: { ...defaultSettings.social, ...data.settings.social },
            features: { ...defaultSettings.features, ...data.settings.features },
            content: { ...defaultSettings.content, ...data.settings.content },
            pages: {
              about: { ...defaultSettings.pages.about, ...dbPages.about },
              contact: { ...defaultSettings.pages.contact, ...dbPages.contact },
              legal: { ...defaultSettings.pages.legal, ...dbPages.legal },
              pricing: { ...defaultSettings.pages.pricing, ...dbPages.pricing },
              faq: { ...defaultSettings.pages.faq, ...dbPages.faq },
              customPages: dbPages.customPages || defaultSettings.pages.customPages,
            },
          })
        } else {
          setSettings(defaultSettings)
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
        setSettings(defaultSettings)
      } finally {
        clearTimeout(timeoutId)
        setLoading(false)
      }
    }
    
    loadSettings()
    
    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  const isLoading = loading || settings === null
  return { settings: isLoading ? null : settings, loading: isLoading, error }
}

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function applyTheme(theme: { background: string; foreground: string; card: string; border: string } | undefined) {
  if (!theme) return
  
  const root = document.documentElement
  
  if (theme.background) {
    const hsl = hexToHSL(theme.background)
    if (hsl) {
      root.style.setProperty('--background', hsl)
      root.style.setProperty('--popover', hsl)
    }
  }
  if (theme.foreground) {
    const hsl = hexToHSL(theme.foreground)
    if (hsl) {
      root.style.setProperty('--foreground', hsl)
      root.style.setProperty('--popover-foreground', hsl)
      root.style.setProperty('--card-foreground', hsl)
    }
  }
  if (theme.card) {
    const hsl = hexToHSL(theme.card)
    if (hsl) root.style.setProperty('--card', hsl)
  }
  if (theme.border) {
    const hsl = hexToHSL(theme.border)
    if (hsl) {
      root.style.setProperty('--border', hsl)
      root.style.setProperty('--input', hsl)
    }
  }
}

export function useThemeFromSettings(settings: SiteSettings | null) {
  useEffect(() => {
    if (!settings) return
    
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    
    if (settings.branding.primaryColor) {
      const hsl = hexToHSL(settings.branding.primaryColor)
      if (hsl) {
        root.style.setProperty('--primary', hsl)
      }
    }
    if (settings.branding.accentColor) {
      const hsl = hexToHSL(settings.branding.accentColor)
      if (hsl) {
        root.style.setProperty('--accent', hsl)
      }
    }
    
    const theme = isDark ? settings.branding.darkTheme : settings.branding.lightTheme
    applyTheme(theme)
  }, [settings?.branding])
  
  useEffect(() => {
    if (!settings) return
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const root = document.documentElement
          const isDark = root.classList.contains('dark')
          const theme = isDark ? settings.branding.darkTheme : settings.branding.lightTheme
          
          if (settings.branding.primaryColor) {
            const hsl = hexToHSL(settings.branding.primaryColor)
            if (hsl) root.style.setProperty('--primary', hsl)
          }
          if (settings.branding.accentColor) {
            const hsl = hexToHSL(settings.branding.accentColor)
            if (hsl) root.style.setProperty('--accent', hsl)
          }
          
          applyTheme(theme)
        }
      })
    })
    
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [settings?.branding])
}
