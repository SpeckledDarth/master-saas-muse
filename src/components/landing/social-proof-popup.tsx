'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface ActivityItem {
  name: string
  action: string
  location?: string
  timeAgo: string
}

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  { name: 'Sarah', action: 'just scheduled 12 posts', location: 'Austin, TX', timeAgo: '2 min ago' },
  { name: 'Marcus', action: 'connected their LinkedIn account', location: 'New York, NY', timeAgo: '5 min ago' },
  { name: 'Emily', action: 'generated 8 AI posts', location: 'London, UK', timeAgo: '8 min ago' },
  { name: 'Jake', action: 'published a blog article', location: 'Denver, CO', timeAgo: '12 min ago' },
  { name: 'Priya', action: 'hit a 30-day posting streak', location: 'Toronto, CA', timeAgo: '15 min ago' },
  { name: 'Alex', action: 'repurposed a blog into 7 posts', location: 'Seattle, WA', timeAgo: '18 min ago' },
  { name: 'Jordan', action: 'signed up for Premium', location: 'Chicago, IL', timeAgo: '22 min ago' },
  { name: 'Nina', action: 'exported a white-label report', location: 'Miami, FL', timeAgo: '25 min ago' },
]

interface SocialProofPopupProps {
  enabled?: boolean
  intervalMs?: number
  displayMs?: number
}

export function SocialProofPopup({
  enabled = true,
  intervalMs = 15000,
  displayMs = 5000,
}: SocialProofPopupProps) {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState<ActivityItem | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [activityIndex, setActivityIndex] = useState(0)

  const showNext = useCallback(() => {
    if (dismissed) return
    const activity = SAMPLE_ACTIVITIES[activityIndex % SAMPLE_ACTIVITIES.length]
    setCurrent(activity)
    setVisible(true)
    setActivityIndex(prev => prev + 1)

    setTimeout(() => {
      setVisible(false)
    }, displayMs)
  }, [activityIndex, dismissed, displayMs])

  useEffect(() => {
    if (!enabled || dismissed) return

    const initialDelay = setTimeout(() => {
      showNext()
    }, 8000)

    return () => clearTimeout(initialDelay)
  }, [enabled, dismissed, showNext])

  useEffect(() => {
    if (!enabled || dismissed || activityIndex === 0) return

    const interval = setInterval(showNext, intervalMs + displayMs)
    return () => clearInterval(interval)
  }, [enabled, dismissed, activityIndex, intervalMs, displayMs, showNext])

  if (!enabled || dismissed || !current) return null

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 max-w-sm transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
      data-testid="social-proof-popup"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
            {current.name[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{current.name}</span>{' '}
            <span className="text-muted-foreground">{current.action}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {current.location && <span>{current.location} · </span>}
            {current.timeAgo}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground p-1 flex-shrink-0"
          data-testid="button-dismiss-social-proof"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
