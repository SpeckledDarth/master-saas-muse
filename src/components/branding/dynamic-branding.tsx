'use client'

import { useSettings, useThemeFromSettings } from '@/hooks/use-settings'
import { defaultSettings } from '@/types/settings'

export function DynamicBranding({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings()
  
  useThemeFromSettings(settings)
  
  return <>{children}</>
}

export function AppName() {
  const { settings } = useSettings()
  
  useThemeFromSettings(settings)
  
  return <span data-testid="text-app-name">{settings.branding.appName || defaultSettings.branding.appName}</span>
}

export function AppTagline() {
  const { settings } = useSettings()
  
  return <span data-testid="text-app-tagline">{settings.branding.tagline || defaultSettings.branding.tagline}</span>
}

export function CompanyName() {
  const { settings } = useSettings()
  
  return <span data-testid="text-company-name">{settings.branding.companyName || defaultSettings.branding.companyName}</span>
}

export function SupportEmail() {
  const { settings } = useSettings()
  const email = settings.branding.supportEmail || defaultSettings.branding.supportEmail
  
  return (
    <a 
      href={`mailto:${email}`}
      data-testid="link-support-email"
    >
      {email}
    </a>
  )
}

export function HeroImage({ className }: { className?: string }) {
  const { settings, loading } = useSettings()
  
  if (loading || !settings.branding.heroImageUrl) return null
  
  return (
    <img 
      src={settings.branding.heroImageUrl}
      alt="Hero"
      className={className}
      data-testid="img-hero"
    />
  )
}

export function useHeroImageUrl() {
  const { settings, loading } = useSettings()
  return { url: settings.branding.heroImageUrl, loading }
}
