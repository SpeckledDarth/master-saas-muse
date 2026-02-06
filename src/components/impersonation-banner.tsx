'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export function ImpersonationBanner() {
  const [active, setActive] = useState(false)
  const [targetEmail, setTargetEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/impersonate/status')
      .then(r => r.json())
      .then(data => {
        if (data.active) {
          setActive(true)
          setTargetEmail(data.targetUser.email)
        }
      })
      .catch(() => {})
  }, [])

  async function stopImpersonation() {
    setLoading(true)
    await fetch('/api/admin/impersonate', { method: 'DELETE' })
    window.location.href = '/admin/users'
  }

  if (!active) return null

  return (
    <div className="w-full bg-yellow-500 text-yellow-950 px-4 py-2" data-testid="banner-impersonation">
      <div className="container mx-auto flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium" data-testid="text-impersonation-info">
            Viewing as <strong>{targetEmail}</strong> — Actions are attributed to this user.
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="bg-yellow-600 border-yellow-700 text-yellow-50 shrink-0"
          onClick={stopImpersonation}
          disabled={loading}
          data-testid="button-stop-impersonation"
        >
          Stop Impersonation
        </Button>
      </div>
    </div>
  )
}
