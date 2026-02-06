'use client'

import { useState, useEffect, useRef } from 'react'
import { SiteSettings, defaultSettings } from '@/types/settings'
import { createClient } from '@/lib/supabase/client'

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const settingsLoadedRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      if (!settingsLoadedRef.current) {
        setSettings(defaultSettings)
        setLoading(false)
      }
    }, 5000)
    
    async function loadSettings() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          settingsLoadedRef.current = true
          setSettings(defaultSettings)
          setLoading(false)
          clearTimeout(timeoutId)
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
          settingsLoadedRef.current = true
          setSettings(defaultSettings)
          setLoading(false)
          clearTimeout(timeoutId)
          return
        }
        
        if (data?.settings) {
          const dbPages = data.settings.pages || {}
          const dbNavigation = data.settings.navigation || {}
          const dbAnnouncement = data.settings.announcement || {}
          const dbBranding = data.settings.branding || {}
          setSettings({
            branding: { 
              ...defaultSettings.branding, 
              ...dbBranding,
              // Deep merge nested theme objects
              lightTheme: { ...defaultSettings.branding.lightTheme, ...(dbBranding.lightTheme || {}) },
              darkTheme: { ...defaultSettings.branding.darkTheme, ...(dbBranding.darkTheme || {}) },
            },
            pricing: { ...defaultSettings.pricing, ...data.settings.pricing },
            social: { ...defaultSettings.social, ...data.settings.social },
            features: { ...defaultSettings.features, ...data.settings.features },
            content: { ...defaultSettings.content, ...data.settings.content },
            navigation: {
              items: dbNavigation.items || defaultSettings.navigation?.items || [],
            },
            announcement: { ...defaultSettings.announcement, ...dbAnnouncement },
            pages: {
              about: { ...defaultSettings.pages.about, ...dbPages.about },
              contact: { ...defaultSettings.pages.contact, ...dbPages.contact },
              legal: { ...defaultSettings.pages.legal, ...dbPages.legal },
              pricing: { ...defaultSettings.pages.pricing, ...dbPages.pricing },
              faq: { ...defaultSettings.pages.faq, ...dbPages.faq },
              customPages: dbPages.customPages || defaultSettings.pages.customPages,
            },
            ai: data.settings.ai ? { ...defaultSettings.ai, ...data.settings.ai } : defaultSettings.ai,
            webhooks: data.settings.webhooks || defaultSettings.webhooks,
            compliance: data.settings.compliance ? { ...defaultSettings.compliance, ...data.settings.compliance } : defaultSettings.compliance,
            support: data.settings.support ? { ...defaultSettings.support, ...data.settings.support } : defaultSettings.support,
            security: data.settings.security ? { ...defaultSettings.security, ...data.settings.security } : defaultSettings.security,
          })
        } else {
          setSettings(defaultSettings)
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
        setSettings(defaultSettings)
      } finally {
        settingsLoadedRef.current = true
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

function getContrastForeground(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0 0% 100%'
  
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5 ? '0 0% 0%' : '0 0% 100%'
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
  // Apply all theme colors - both brand colors and theme-specific colors
  useEffect(() => {
    if (!settings) return
    
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    
    // Apply brand colors (primary/accent)
    if (settings.branding.primaryColor) {
      const hsl = hexToHSL(settings.branding.primaryColor)
      if (hsl) {
        root.style.setProperty('--primary', hsl)
        root.style.setProperty('--primary-foreground', getContrastForeground(settings.branding.primaryColor))
      }
    }
    if (settings.branding.accentColor) {
      const hsl = hexToHSL(settings.branding.accentColor)
      if (hsl) {
        root.style.setProperty('--accent', hsl)
        root.style.setProperty('--accent-foreground', getContrastForeground(settings.branding.accentColor))
      }
    }
    
    // Apply theme colors (background/foreground/card/border) based on current mode
    const theme = isDark ? settings.branding.darkTheme : settings.branding.lightTheme
    applyTheme(theme)
  }, [settings?.branding])
  
  // Watch for light/dark mode changes and re-apply the correct theme
  useEffect(() => {
    if (!settings) return
    
    const applyCurrentTheme = () => {
      const root = document.documentElement
      const isDark = root.classList.contains('dark')
      const theme = isDark ? settings.branding.darkTheme : settings.branding.lightTheme
      applyTheme(theme)
    }
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          applyCurrentTheme()
        }
      })
    })
    
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [settings?.branding.lightTheme, settings?.branding.darkTheme])
}
