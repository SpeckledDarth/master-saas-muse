'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowRight } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'

export function AnnouncementBar() {
  const { settings } = useSettings()
  const [dismissed, setDismissed] = useState(false)
  const announcement = settings?.announcement

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('announcement-dismissed')
    if (wasDismissed === 'true') {
      setDismissed(true)
    }
  }, [])

  if (!announcement?.enabled || dismissed) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('announcement-dismissed', 'true')
  }

  return (
    <div 
      className="relative py-2 px-4 text-center text-sm"
      style={{ 
        backgroundColor: announcement.backgroundColor || '#7c3aed',
        color: announcement.textColor || '#ffffff'
      }}
      data-testid="announcement-bar"
    >
      <div className="container mx-auto flex items-center justify-center gap-2">
        <span>{announcement.text}</span>
        {announcement.linkText && announcement.linkUrl && (
          <Link 
            href={announcement.linkUrl}
            className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:no-underline"
            data-testid="link-announcement"
          >
            {announcement.linkText}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {announcement.dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
          aria-label="Dismiss announcement"
          data-testid="button-dismiss-announcement"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
