'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function ReferralTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const refCode = searchParams.get('ref')
    if (!refCode) return

    const storageKey = `ref_tracked_${refCode}`
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) return

    fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref_code: refCode,
        page_url: window.location.pathname,
      }),
    })
      .then(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(storageKey, '1')
          localStorage.setItem('ref_code', refCode)
        }
      })
      .catch(() => {})
  }, [searchParams])

  return null
}
