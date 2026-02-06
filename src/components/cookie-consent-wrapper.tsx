'use client'

import { useSettings } from '@/hooks/use-settings'
import { CookieConsent } from '@/components/cookie-consent'

export function CookieConsentWrapper() {
  const { settings, loading } = useSettings()

  // Don't render anything while settings are loading
  if (loading) {
    return null
  }

  // Only render if cookie consent is enabled in settings
  if (!settings?.compliance?.cookieConsentEnabled) {
    return null
  }

  return (
    <CookieConsent
      text={settings.compliance.cookieConsentText}
      cookiePolicyUrl="/cookie-policy"
    />
  )
}
