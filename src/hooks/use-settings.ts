'use client'

import { useState, useEffect, useRef } from 'react'
import { SiteSettings, defaultSettings } from '@/types/settings'

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
    }, 8000)
    
    async function loadSettings() {
      try {
        const res = await fetch('/api/public/settings', {
          signal: controller.signal,
          cache: 'no-store',
        })

        if (!res.ok) {
          throw new Error(`Settings API returned ${res.status}`)
        }

        const { settings: loaded } = await res.json()

        if (loaded) {
          settingsLoadedRef.current = true
          setSettings(loaded as SiteSettings)
        } else {
          settingsLoadedRef.current = true
          setSettings(defaultSettings)
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        console.error('Failed to load settings:', err)
        settingsLoadedRef.current = true
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

function loadGoogleFont(fontName: string) {
  if (fontName === 'system' || typeof document === 'undefined') return
  const id = `gfont-${fontName.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`
  document.head.appendChild(link)
}

function getFontFamily(value: string): string {
  if (!value || value === 'system') return ''
  const serifFonts = ['Lora', 'Playfair Display', 'Merriweather', 'Source Serif 4', 'Crimson Pro', 'DM Serif Display']
  const monoFonts = ['JetBrains Mono', 'Fira Code']
  const fallback = serifFonts.includes(value) ? ', serif' : monoFonts.includes(value) ? ', monospace' : ', sans-serif'
  return `"${value}"${fallback}`
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
  
  // Apply fonts from settings to the live site
  useEffect(() => {
    if (!settings) return
    const root = document.documentElement
    
    const headingFont = settings.branding.headingFont
    const bodyFont = settings.branding.bodyFont
    
    if (headingFont && headingFont !== 'system') {
      loadGoogleFont(headingFont)
      root.style.setProperty('--font-heading', getFontFamily(headingFont))
    } else {
      root.style.removeProperty('--font-heading')
    }
    
    if (bodyFont && bodyFont !== 'system') {
      loadGoogleFont(bodyFont)
      const family = getFontFamily(bodyFont)
      root.style.setProperty('--font-body', family)
    } else {
      root.style.removeProperty('--font-body')
    }
  }, [settings?.branding.headingFont, settings?.branding.bodyFont])
  
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
