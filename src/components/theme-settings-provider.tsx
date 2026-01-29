'use client'

import { useEffect, useState } from 'react'
import { useSettings, useThemeFromSettings } from '@/hooks/use-settings'

export function ThemeSettingsProvider({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useSettings()
  const [themeApplied, setThemeApplied] = useState(false)
  
  useThemeFromSettings(settings)
  
  // Make body visible after theme is applied
  useEffect(() => {
    if (settings && !loading && !themeApplied) {
      // Small delay to ensure CSS variables are set
      const timer = setTimeout(() => {
        document.body.style.visibility = 'visible'
        setThemeApplied(true)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [settings, loading, themeApplied])
  
  // Fallback: make visible after 2 seconds even if settings fail
  useEffect(() => {
    const fallback = setTimeout(() => {
      document.body.style.visibility = 'visible'
    }, 2000)
    return () => clearTimeout(fallback)
  }, [])
  
  return <>{children}</>
}
