'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export function ReferralTracker() {
  const searchParams = useSearchParams()
  const [cookieDays, setCookieDays] = useState(30)

  useEffect(() => {
    fetch('/api/affiliate/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.settings?.cookie_duration_days) {
          setCookieDays(data.settings.cookie_duration_days)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const refCode = searchParams.get('ref')
    if (!refCode) return

    const storageKey = `ref_tracked_${refCode}`
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) return

    setCookie('pp_ref', refCode, cookieDays)
    localStorage.setItem('ref_code', refCode)

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
        }
      })
      .catch(() => {})
  }, [searchParams, cookieDays])

  return null
}
