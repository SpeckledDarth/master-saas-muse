'use client'

import { useSettings, useThemeFromSettings } from '@/hooks/use-settings'

export function DynamicBranding({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useSettings()
  
  useThemeFromSettings(settings)
  
  return <>{children}</>
}

export function AppName() {
  const { settings, loading } = useSettings()
  
  if (loading) return <span>Loading...</span>
  
  return <span data-testid="text-app-name">{settings.branding.appName}</span>
}

export function AppTagline() {
  const { settings, loading } = useSettings()
  
  if (loading) return null
  
  return <span data-testid="text-app-tagline">{settings.branding.tagline}</span>
}

export function CompanyName() {
  const { settings, loading } = useSettings()
  
  if (loading) return null
  
  return <span data-testid="text-company-name">{settings.branding.companyName}</span>
}

export function SupportEmail() {
  const { settings, loading } = useSettings()
  
  if (loading) return null
  
  return (
    <a 
      href={`mailto:${settings.branding.supportEmail}`}
      data-testid="link-support-email"
    >
      {settings.branding.supportEmail}
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
