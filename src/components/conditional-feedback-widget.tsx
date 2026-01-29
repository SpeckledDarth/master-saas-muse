'use client'

import { useSettings } from '@/hooks/use-settings'
import { FeedbackWidget } from './feedback-widget'

export function ConditionalFeedbackWidget() {
  const { settings } = useSettings()
  
  if (!settings?.features?.feedbackWidget) {
    return null
  }
  
  return <FeedbackWidget />
}
