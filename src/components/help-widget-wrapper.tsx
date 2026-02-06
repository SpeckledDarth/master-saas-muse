'use client'

import { useSettings } from '@/hooks/use-settings'
import { HelpWidget } from '@/components/help-widget'

export function HelpWidgetWrapper() {
  const { settings } = useSettings()

  if (!settings?.support?.enabled) return null

  return (
    <HelpWidget
      position={settings.support.widgetPosition}
      color={settings.support.widgetColor}
      welcomeMessage={settings.support.welcomeMessage}
      fallbackEmail={settings.support.fallbackEmail}
    />
  )
}
