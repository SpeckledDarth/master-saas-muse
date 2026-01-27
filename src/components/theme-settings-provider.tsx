'use client'

import { useSettings, useThemeFromSettings } from '@/hooks/use-settings'

export function ThemeSettingsProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings()
  
  useThemeFromSettings(settings)
  
  return <>{children}</>
}
