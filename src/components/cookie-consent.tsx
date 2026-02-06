'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface CookieConsentProps {
  text?: string
  cookiePolicyUrl?: string
}

export function CookieConsent({
  text = 'We use cookies to enhance your experience and analyze our traffic. By continuing to use this site, you consent to our use of cookies.',
  cookiePolicyUrl = '/cookie-policy',
}: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a cookie decision
    const hasConsent = localStorage.getItem('cookie-consent-accepted')
    if (!hasConsent) {
      setShowBanner(true)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem('cookie-consent-accepted', 'all')
    setShowBanner(false)
  }

  const handleRejectNonEssential = () => {
    localStorage.setItem('cookie-consent-accepted', 'essential-only')
    setShowBanner(false)
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-4xl rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-card-foreground">
            {text}
            {' '}
            <a
              href={cookiePolicyUrl}
              className="underline text-primary"
              data-testid="link-cookie-policy"
            >
              Learn more
            </a>
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectNonEssential}
              data-testid="button-reject-non-essential"
            >
              Essential Only
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptAll}
              data-testid="button-accept-all"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
