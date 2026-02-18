'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { X, ArrowUpRight } from 'lucide-react'

export function SocialUpgradeBanner() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('social-upgrade-dismissed')
    if (stored === 'true') return

    async function check() {
      try {
        const [tierRes, postsRes] = await Promise.all([
          fetch('/api/social/tier'),
          fetch('/api/social/posts?limit=200'),
        ])
        if (!tierRes.ok || !postsRes.ok) return

        const tierData = await tierRes.json()
        const postsData = await postsRes.json()

        const monthlyLimit = tierData.limits?.monthlyPosts
        if (!monthlyLimit || monthlyLimit >= 999999) return

        const now = new Date()
        const posts = (postsData.posts || []).filter((p: { created_at: string }) => {
          const d = new Date(p.created_at)
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
        })

        const usage = posts.length
        const pct = Math.round((usage / monthlyLimit) * 100)

        if (pct >= 100) {
          setMessage(`You've used all ${monthlyLimit} posts this month. Upgrade to keep posting.`)
          setVisible(true)
        } else if (pct >= 80) {
          const remaining = monthlyLimit - usage
          setMessage(`${remaining} post${remaining === 1 ? '' : 's'} remaining this month (${pct}% used). Upgrade for more.`)
          setVisible(true)
        }
      } catch {}
    }

    check()
  }, [])

  if (!visible || dismissed) return null

  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-primary-600 dark:bg-primary-400 px-4 py-2"
      data-testid="banner-upgrade"
    >
      <p className="text-sm text-white dark:text-black">{message}</p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button variant="secondary" size="sm" asChild data-testid="button-banner-upgrade">
          <Link href="/pricing">
            Upgrade
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white dark:text-black"
          onClick={() => {
            setDismissed(true)
            sessionStorage.setItem('social-upgrade-dismissed', 'true')
          }}
          data-testid="button-banner-dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
