'use client'

import { useSettings } from '@/hooks/use-settings'
import { HelpWidget } from '@/components/help-widget'
import { FeedbackWidget } from '@/components/feedback-widget'

export function UnifiedSupportWidget() {
  const { settings, loading } = useSettings()

  if (loading) return null

  if (settings?.support?.enabled) {
    return (
      <HelpWidget
        position={settings.support.widgetPosition}
        color={settings.support.widgetColor}
        welcomeMessage={settings.support.welcomeMessage}
        fallbackEmail={settings.support.fallbackEmail}
      />
    )
  }

  if (settings?.features?.feedbackWidget) {
    return <FeedbackWidget />
  }

  return null
}
